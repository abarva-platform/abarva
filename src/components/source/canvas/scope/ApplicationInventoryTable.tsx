"use client";

import type { CSSProperties } from "react";
import { CANVAS } from "../canvas-tokens";

type InventoryRow = {
  appName: string;
  criticality: "High" | "Medium" | "Low";
  vendor: string;
  annualCost: string;
  sla: string;
  volume: string;
  inScope: boolean;
};

const DEFAULT_ROWS: InventoryRow[] = [
  {
    appName: "SAP ECC support tower",
    criticality: "High",
    vendor: "Incumbent AMS provider",
    annualCost: "$14.2M",
    sla: "P1 response under 30m",
    volume: "160 apps",
    inScope: true,
  },
  {
    appName: "Sterling OMS integrations",
    criticality: "High",
    vendor: "Retail platform team",
    annualCost: "$5.8M",
    sla: "Peak-season freeze support",
    volume: "48 interfaces",
    inScope: true,
  },
  {
    appName: "NCR POS field support",
    criticality: "Medium",
    vendor: "Store operations",
    annualCost: "$3.1M",
    sla: "Store-hours coverage",
    volume: "1,180 stores",
    inScope: true,
  },
  {
    appName: "Core network refresh",
    criticality: "Low",
    vendor: "Infrastructure tower",
    annualCost: "$0",
    sla: "Separate sourcing lane",
    volume: "Out of event",
    inScope: false,
  },
];

export function ApplicationInventoryTable({
  rows = DEFAULT_ROWS,
}: {
  rows?: InventoryRow[];
}) {
  return (
    <div data-testid="source-scope-inventory-table" style={WRAP_STYLE}>
      <div style={HEADER_STYLE}>
        <div>
          <div style={EYEBROW_STYLE}>Application inventory</div>
          <h3 style={TITLE_STYLE}>Scope baseline</h3>
        </div>
        <button type="button" disabled style={DISABLED_BUTTON_STYLE}>
          Pull from CMDB
        </button>
      </div>
      <p style={HELP_STYLE}>
        Explicit pull only. Connect the CMDB source in Setup before importing;
        Source never silently populates inventory on stage entry.
      </p>
      <div style={TABLE_WRAP_STYLE}>
        <table style={TABLE_STYLE}>
          <thead>
            <tr>
              {["Application", "Criticality", "Vendor", "Cost", "SLA", "Volume", "Scope"].map(
                (heading) => (
                  <th key={heading} style={TH_STYLE}>
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.appName}>
                <td style={TD_STRONG_STYLE}>{row.appName}</td>
                <td style={TD_STYLE}>{row.criticality}</td>
                <td style={TD_STYLE}>{row.vendor}</td>
                <td style={TD_STYLE}>{row.annualCost}</td>
                <td style={TD_STYLE}>{row.sla}</td>
                <td style={TD_STYLE}>{row.volume}</td>
                <td style={TD_STYLE}>{row.inScope ? "In scope" : "Out"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const WRAP_STYLE: CSSProperties = {
  display: "grid",
  gap: 10,
  padding: 16,
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 8,
  background: "#fff",
};

const HEADER_STYLE: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "flex-start",
  flexWrap: "wrap",
};

const EYEBROW_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: CANVAS.INK_MUTED,
};

const TITLE_STYLE: CSSProperties = {
  margin: "4px 0 0",
  fontFamily: CANVAS.SERIF,
  fontSize: 22,
  fontWeight: 400,
  color: CANVAS.INK,
};

const HELP_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  lineHeight: 1.45,
  color: CANVAS.INK_SOFT,
};

const DISABLED_BUTTON_STYLE: CSSProperties = {
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 6,
  padding: "8px 12px",
  background: "#F5F1EA",
  color: CANVAS.INK_MUTED,
  fontFamily: CANVAS.SANS,
  fontSize: 12,
  fontWeight: 700,
  cursor: "not-allowed",
};

const TABLE_WRAP_STYLE: CSSProperties = {
  overflowX: "auto",
};

const TABLE_STYLE: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 780,
};

const TH_STYLE: CSSProperties = {
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
  padding: "8px 10px",
  textAlign: "left",
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: CANVAS.INK_MUTED,
};

const TD_STYLE: CSSProperties = {
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
  padding: "10px",
  fontFamily: CANVAS.SANS,
  fontSize: 12,
  color: CANVAS.INK_SOFT,
  verticalAlign: "top",
};

const TD_STRONG_STYLE: CSSProperties = {
  ...TD_STYLE,
  color: CANVAS.INK,
  fontWeight: 700,
};
