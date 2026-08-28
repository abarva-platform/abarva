"use client";

import { useMemo, useState } from "react";
import { DataTable } from "../DataTable";
import type { DataTableRow } from "../DataTable";
import type { SourceWorkspaceVM } from "../buildViewModel";

function rowSearchText(row: DataTableRow): string {
  return row.cells
    .map((cell) =>
      [cell.text, cell.sub]
        .filter(
          (value): value is string | number =>
            typeof value === "string" || typeof value === "number",
        )
        .join(" "),
    )
    .join(" ")
    .toLowerCase();
}

export function ListLens({ vm }: { vm: SourceWorkspaceVM }) {
  const [vendorQuery, setVendorQuery] = useState("");
  const filteredVendorRows = useMemo(() => {
    const query = vendorQuery.trim().toLowerCase();
    if (!query) return vm.vendorListRows;
    return vm.vendorListRows.filter((row) =>
      rowSearchText(row).includes(query),
    );
  }, [vendorQuery, vm.vendorListRows]);

  if (vm.isContractList) {
    return (
      <DataTable
        title="Contract register — saved view"
        note="Row click opens Contract 360. Filtered client-side over the same governed register already loaded for this page — no separate query or dataset."
        binding="SourceRenewalExposure + SourceSourcingLeverage"
        columns={vm.listCols}
        rows={vm.listRows}
        footnote="Saved views are filters on the governed register, not separate datasets."
      />
    );
  }
  if (vm.isVendorList) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label
          style={{
            alignItems: "center",
            background: "#fff",
            border: "1px solid rgba(10,10,11,.12)",
            borderRadius: 8,
            display: "flex",
            gap: 12,
            padding: "12px 16px",
          }}
        >
          <span
            style={{
              color: "#888780",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9.5,
              fontWeight: 600,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            Search vendors
          </span>
          <input
            aria-label="Search vendors"
            value={vendorQuery}
            onChange={(event) => setVendorQuery(event.target.value)}
            placeholder="Epic, AWS, category, or value"
            style={{
              border: 0,
              color: "#0a0a0b",
              flex: 1,
              fontSize: 14,
              minWidth: 160,
              outline: "none",
            }}
            type="search"
          />
          <span
            aria-live="polite"
            style={{
              color: "#5f5e5a",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              whiteSpace: "nowrap",
            }}
          >
            {filteredVendorRows.length} of {vm.vendorListRows.length}
          </span>
        </label>
        <DataTable
          title="Vendors — category view"
          note="Row click opens Vendor 360."
          binding="SourceVendorConcentration"
          columns={vm.vendorCols}
          rows={filteredVendorRows}
          footnote={
            filteredVendorRows.length
              ? "Vendor rollups aggregate reconciled contract records at canonical vendor_ref, so duplicate legal entities cannot change portfolio totals."
              : "No vendors match this search."
          }
        />
      </div>
    );
  }
  return null;
}
