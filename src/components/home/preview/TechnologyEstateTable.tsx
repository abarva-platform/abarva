"use client";

import { useMemo, useState, type CSSProperties } from "react";

import { HOME_HEX } from "./visuals/home-chart-kit";
import { computeCrossTab, eligibleCrossDimensions, type CrossTab } from "@/lib/home/preview/segmentation";
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
  const [crossDimension, setCrossDimension] = useState<string | null>(null);
  const [crossFilter, setCrossFilter] = useState<string | null>(null);

  const crossOptions = useMemo(() => eligibleCrossDimensions(recordType), [recordType]);
  // A primary dimension that's nearly one distinct value per record (e.g. a vendor contract's
  // free-text service category) filters to a single row per chip -- real, but not a useful
  // segmentation. Surface only values with a real cluster (count > 1); note the rest exist rather
  // than rendering dozens of one-record chips nobody would click.
  const clusteredDimensionCounts = useMemo(
    () => recordType.dimensionCounts.filter((d) => d.count > 1),
    [recordType],
  );
  const singletonDimensionCount = recordType.dimensionCounts.length - clusteredDimensionCounts.length;
  const crossTab = useMemo(
    () => (crossDimension ? computeCrossTab(recordType, crossDimension) : null),
    [recordType, crossDimension],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recordType.rows.filter((row) => {
      if (dimensionFilter && recordType.primaryDimension) {
        const value = row[recordType.primaryDimension];
        const bucket = value === null || value === undefined || value === "" ? "(not specified)" : String(value);
        if (bucket !== dimensionFilter) return false;
      }
      if (crossFilter && crossDimension) {
        const value = row[crossDimension];
        const bucket = value === null || value === undefined || value === "" ? "(not specified)" : String(value);
        if (bucket !== crossFilter) return false;
      }
      if (!q) return true;
      return recordType.columns.some((col) => String(row[col] ?? "").toLowerCase().includes(q));
    });
  }, [recordType, query, dimensionFilter, crossFilter, crossDimension]);

  function selectCrossDimension(next: string | null) {
    setCrossDimension(next);
    setCrossFilter(null);
  }

  function selectCell(rowValue: string, colValue: string) {
    setDimensionFilter(rowValue);
    setCrossFilter(colValue);
  }

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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
            <p style={{ margin: 0, fontFamily: "var(--font-body-sans)", fontSize: 11, fontWeight: 600, color: HOME_HEX.textDisabled, textTransform: "uppercase", letterSpacing: "0.03em" }}>
              By {recordType.primaryDimension}
            </p>
            {crossOptions.length > 0 ? (
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-body-sans)", fontSize: 11.5, color: HOME_HEX.textMuted }}>
                Cross with
                <select
                  value={crossDimension ?? ""}
                  onChange={(e) => selectCrossDimension(e.target.value || null)}
                  aria-label="Cross with a second field"
                  style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${HOME_HEX.border}`, fontFamily: "var(--font-body-sans)", fontSize: 12, color: HOME_HEX.textPrimary, background: "#FFFFFF" }}
                >
                  <option value="">None</option>
                  {crossOptions.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>

          {crossTab ? (
            <SegmentationMatrix
              crossTab={crossTab}
              activeRow={dimensionFilter}
              activeCol={crossFilter}
              onSelectCell={selectCell}
              onClear={() => {
                setDimensionFilter(null);
                setCrossFilter(null);
              }}
            />
          ) : clusteredDimensionCounts.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
              <DimensionChip label="All" count={recordType.rows.length} active={dimensionFilter === null} onClick={() => setDimensionFilter(null)} />
              {clusteredDimensionCounts.map((d) => (
                <DimensionChip key={d.value} label={d.value} count={d.count} active={dimensionFilter === d.value} onClick={() => setDimensionFilter(d.value)} />
              ))}
              {singletonDimensionCount > 0 ? (
                <span style={{ fontFamily: "var(--font-body-sans)", fontSize: 11.5, color: HOME_HEX.textDisabled, fontStyle: "italic" }}>
                  +{singletonDimensionCount} more {recordType.primaryDimension} values, 1 record each -- use search below
                </span>
              ) : null}
            </div>
          ) : (
            <p style={{ margin: 0, fontFamily: "var(--font-body-sans)", fontSize: 12.5, color: HOME_HEX.textDisabled, fontStyle: "italic" }}>
              Every {recordType.primaryDimension} value here is unique to one record -- this field doesn&rsquo;t cluster.
              Use search below, or Cross with a broader field above.
            </p>
          )}
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

/** A real business-segment-by-real-field cross-tab -- e.g. business function x deployment model,
 * or data domain x analytics usage -- built from computeCrossTab, which only ever counts real
 * per-record values. Every cell is a button: clicking it filters the table below to that exact
 * (row, column) combination. Cell shading is a plain lightness ramp on record count, not a
 * separate authored judgment. */
function SegmentationMatrix({
  crossTab,
  activeRow,
  activeCol,
  onSelectCell,
  onClear,
}: {
  crossTab: CrossTab;
  activeRow: string | null;
  activeCol: string | null;
  onSelectCell: (rowValue: string, colValue: string) => void;
  onClear: () => void;
}) {
  const maxCount = Math.max(1, ...crossTab.matrix.flat());

  return (
    <div>
      {activeRow || activeCol ? (
        <button
          type="button"
          onClick={onClear}
          style={{ margin: "0 0 8px", padding: 0, border: "none", background: "transparent", color: HOME_HEX.teal, fontFamily: "var(--font-body-sans)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
        >
          Clear selection
        </button>
      ) : null}
      <div style={{ overflowX: "auto", border: `1px solid ${HOME_HEX.border}`, borderRadius: 8 }}>
        <table style={{ borderCollapse: "collapse", fontFamily: "var(--font-body-sans)", fontSize: 12 }}>
          <thead>
            <tr>
              <th style={matrixHeaderStyle("left")}>{crossTab.rowDimension}</th>
              {crossTab.colValues.map((col) => (
                <th key={col} style={matrixHeaderStyle("right")}>
                  {col}
                </th>
              ))}
              <th style={{ ...matrixHeaderStyle("right"), fontWeight: 700 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {crossTab.rowValues.map((rowValue, rowIdx) => (
              <tr key={rowValue}>
                <th scope="row" style={{ ...matrixHeaderStyle("left"), fontWeight: 500, whiteSpace: "nowrap", background: "#FAFAF9" }}>
                  {rowValue}
                </th>
                {crossTab.colValues.map((colValue, colIdx) => {
                  const count = crossTab.matrix[rowIdx][colIdx];
                  const active = activeRow === rowValue && activeCol === colValue;
                  return (
                    <td key={colValue} style={{ padding: 0, borderBottom: `1px solid ${HOME_HEX.border}` }}>
                      <button
                        type="button"
                        onClick={() => onSelectCell(rowValue, colValue)}
                        disabled={count === 0}
                        aria-pressed={active}
                        title={`${rowValue} × ${colValue}: ${count}`}
                        style={{
                          width: "100%",
                          minWidth: 44,
                          padding: "8px 10px",
                          border: active ? `2px solid ${HOME_HEX.navy}` : "1px solid transparent",
                          background: active ? HOME_HEX.navyDim : count === 0 ? "transparent" : cellBackground(count, maxCount),
                          color: count === 0 ? HOME_HEX.textDisabled : HOME_HEX.textPrimary,
                          fontFamily: "var(--font-body-mono)",
                          fontSize: 12,
                          textAlign: "right",
                          cursor: count === 0 ? "default" : "pointer",
                        }}
                      >
                        {count || "—"}
                      </button>
                    </td>
                  );
                })}
                <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "var(--font-body-mono)", fontWeight: 700, borderBottom: `1px solid ${HOME_HEX.border}` }}>
                  {crossTab.rowTotals[rowIdx]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function matrixHeaderStyle(align: "left" | "right"): CSSProperties {
  return {
    padding: "8px 10px",
    textAlign: align,
    whiteSpace: "nowrap",
    color: HOME_HEX.textMuted,
    fontWeight: 600,
    fontSize: 10.5,
    textTransform: "uppercase",
    letterSpacing: "0.02em",
    borderBottom: `1px solid ${HOME_HEX.border}`,
    background: "#FAFAF9",
  };
}

function cellBackground(count: number, maxCount: number): string {
  const intensity = Math.min(1, count / maxCount);
  const alpha = 0.08 + intensity * 0.28;
  return `rgba(27, 43, 92, ${alpha.toFixed(2)})`; // HOME_HEX.navy at a data-driven alpha
}
