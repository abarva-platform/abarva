"use client";

import { DataTable } from "../DataTable";
import type { SourceWorkspaceVM } from "../buildViewModel";

export function OpportunitiesLens({ vm }: { vm: SourceWorkspaceVM }) {
  return (
    <>
      <div style={{ fontSize: 12.5, color: "#5f5e5a" }}>
        Computed by computeSourcingOpportunities from weak-leverage signals,
        missed renewal-notice deadlines, and vendor concentration — never a
        fabricated priority score.
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))",
          gap: 14,
          alignItems: "start",
        }}
      >
        {vm.oppGroups.map((g, gi) => (
          <div
            key={gi}
            style={{
              background: "#fff",
              border: "1px solid rgba(10,10,11,.12)",
              borderTop: `3px solid ${g.color}`,
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "15px 20px 12px",
                borderBottom: "1px solid rgba(10,10,11,.09)",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <div
                  style={{ fontSize: 14, fontWeight: 600, color: "#0a0a0b" }}
                >
                  {g.label}
                </div>
                <div
                  style={{
                    marginLeft: "auto",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11.5,
                    color: "#5f5e5a",
                  }}
                >
                  {g.count} · {g.value}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {g.items.map((o) => (
                <div
                  key={o.ref}
                  onClick={o.onClick}
                  className="sw-hover-cream"
                  style={{
                    padding: "15px 20px",
                    borderBottom: "1px solid rgba(10,10,11,.07)",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "baseline",
                      gap: 10,
                      marginBottom: 7,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: "#0a0a0b",
                      }}
                    >
                      {o.vendor}
                    </span>
                    <span style={{ fontSize: 12.5, color: "#5f5e5a" }}>
                      {o.name}
                    </span>
                    <span
                      style={{
                        marginLeft: "auto",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#0a0a0b",
                      }}
                    >
                      {o.exposed}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: "#5f5e5a",
                      lineHeight: 1.55,
                    }}
                  >
                    {o.why}
                  </div>
                </div>
              ))}
              {g.items.length === 0 ? (
                <div
                  style={{
                    padding: "15px 20px",
                    fontSize: 12.5,
                    color: "#b4b2a9",
                  }}
                >
                  None flagged.
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <DataTable
        title="Opportunity pipeline"
        note="One row per deterministic opportunity. Row click opens the contract canvas."
        binding="computeSourcingOpportunities(source.contract_360)"
        columns={vm.oppCols}
        rows={vm.oppRows}
        footnote="Reasons are computed, not ranked by a hidden priority score."
      />
    </>
  );
}
