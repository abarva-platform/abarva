"use client";

import type { CSSProperties, ReactNode } from "react";

export interface DataTableColumn {
  label: string;
  align?: "left" | "right" | "center";
}

export interface DataTableCell {
  text: ReactNode;
  sub?: ReactNode;
  align?: "left" | "right" | "center";
  color?: string;
  weight?: number;
  mono?: boolean;
  wrap?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface DataTableRow {
  cells: DataTableCell[];
  onClick?: () => void;
}

export interface DataTableProps {
  title?: string;
  note?: string;
  binding?: string;
  footnote?: string;
  columns: DataTableColumn[];
  rows: DataTableRow[];
}

const rowStyle: CSSProperties = {
  borderBottom: "1px solid rgba(10,10,11,.07)",
};

export function DataTable({
  title,
  note,
  binding,
  footnote,
  columns,
  rows,
}: DataTableProps) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid rgba(10,10,11,.12)",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      {title ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "baseline",
            gap: 12,
            padding: "16px 20px 13px",
            borderBottom: "1px solid rgba(10,10,11,.12)",
          }}
        >
          <div style={{ fontSize: 14.5, fontWeight: 600, color: "#0a0a0b" }}>
            {title}
          </div>
          {note ? (
            <div style={{ fontSize: 12.5, color: "#5f5e5a", lineHeight: 1.5 }}>
              {note}
            </div>
          ) : null}
          {binding ? (
            <div
              style={{
                marginLeft: "auto",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9.5,
                fontWeight: 600,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                color: "#b4b2a9",
              }}
            >
              {binding}
            </div>
          ) : null}
        </div>
      ) : null}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "max-content",
            minWidth: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
          }}
        >
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th
                  key={i}
                  style={{
                    textAlign: c.align || "left",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9.5,
                    fontWeight: 600,
                    letterSpacing: ".1em",
                    textTransform: "uppercase",
                    color: "#888780",
                    padding: "11px 16px",
                    borderBottom: "1px solid rgba(10,10,11,.12)",
                    whiteSpace: "nowrap",
                    background: "#fbfaf7",
                  }}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr
                key={ri}
                onClick={r.onClick}
                style={{
                  cursor: r.onClick ? "pointer" : "default",
                  ...rowStyle,
                }}
                className="sw-row"
              >
                {r.cells.map((cell, ci) => (
                  <td
                    key={ci}
                    style={{
                      padding: "10px 16px",
                      textAlign: cell.align || "left",
                      color: cell.color || "#2c2c2a",
                      fontWeight: cell.weight || 400,
                      fontFamily: cell.mono
                        ? "'JetBrains Mono', monospace"
                        : "inherit",
                      fontVariantNumeric: "tabular-nums",
                      whiteSpace: cell.wrap ? "normal" : "nowrap",
                      lineHeight: 1.45,
                      minWidth: ci < 2 ? 150 : undefined,
                    }}
                  >
                    {cell.action ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          cell.action?.onClick();
                        }}
                        style={{
                          border: "1px solid rgba(10,10,11,.14)",
                          background: "#fff",
                          borderRadius: 6,
                          color: "#0a0a0b",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 700,
                          padding: "7px 10px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {cell.action.label}
                      </button>
                    ) : (
                      cell.text
                    )}
                    {cell.sub ? (
                      <span style={{ color: "#888780", fontWeight: 400 }}>
                        {" "}
                        {cell.sub}
                      </span>
                    ) : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footnote ? (
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid rgba(10,10,11,.12)",
            fontSize: 12,
            color: "#5f5e5a",
            lineHeight: 1.5,
            background: "#fbfaf7",
          }}
        >
          {footnote}
        </div>
      ) : null}
    </div>
  );
}
