"use client";

import { DataTable } from "../DataTable";
import type { SourceWorkspaceVM } from "../buildViewModel";

export function RenewalsLens({ vm }: { vm: SourceWorkspaceVM }) {
  const tl = vm.tl;
  return (
    <>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          background: "#fff",
          border: "1px solid rgba(10,10,11,.12)",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        {vm.reconCards.map((r, i) => (
          <div
            key={i}
            style={{
              flex: "1 1 220px",
              background: "#fff",
              padding: "16px 18px",
              borderRight: "1px solid rgba(10,10,11,.09)",
              borderTop: "1px solid rgba(10,10,11,.09)",
              marginTop: -1,
            }}
          >
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9.5,
                fontWeight: 600,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                color: "#888780",
                marginBottom: 9,
                lineHeight: 1.35,
              }}
            >
              {r.label}
            </div>
            <div
              style={{
                fontFamily: "Fraunces,Georgia,serif",
                fontSize: 27,
                fontWeight: 500,
                lineHeight: 1,
                color: r.color,
              }}
            >
              {r.value}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#5f5e5a",
                marginTop: 7,
                lineHeight: 1.4,
              }}
            >
              {r.sub}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(10,10,11,.12)",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 14,
            padding: "18px 24px 14px",
            borderBottom: "1px solid rgba(10,10,11,.12)",
          }}
        >
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: "#0a0a0b" }}>
              Renewal and notice exposure
            </div>
            <div style={{ fontSize: 12.5, color: "#5f5e5a", marginTop: 3 }}>
              Notice deadline and expiration on one rolling 18-month axis.
              Bubble size is annual contract value.
            </div>
          </div>
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              gap: 14,
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9.5,
                fontWeight: 600,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                color: "#888780",
              }}
            >
              Decision window
            </span>
            <span style={{ display: "flex", gap: 5 }}>
              {vm.windowBtns.map((w, i) => (
                <button
                  key={i}
                  onClick={w.onClick}
                  style={{
                    border: `1px solid ${w.border}`,
                    background: w.bg,
                    color: w.fg,
                    borderRadius: 6,
                    padding: "7px 13px",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {w.label}
                </button>
              ))}
            </span>
          </div>
        </div>
        <div style={{ padding: "14px 20px 4px", overflowX: "auto" }}>
          <svg
            viewBox={`0 0 ${tl.w} ${tl.h}`}
            style={{
              width: "100%",
              minWidth: 900,
              height: "auto",
              display: "block",
            }}
          >
            <line
              x1={tl.asOfX}
              x2={tl.asOfX}
              y1={tl.axisY}
              y2={tl.h}
              stroke="#0a0a0b"
              strokeWidth={1.4}
            />
            {tl.rows.map((r) => (
              <g
                key={r.key}
                onMouseEnter={r.onEnter}
                onMouseLeave={r.onLeave}
                onClick={r.onClick}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x={0}
                  y={r.bandY}
                  width={tl.w}
                  height={25}
                  fill={r.band}
                />
                <line
                  x1={r.x1}
                  x2={r.x2}
                  y1={r.y}
                  y2={r.y}
                  stroke={r.col}
                  strokeWidth={2}
                  strokeDasharray={r.dash}
                  opacity={0.55}
                />
                <line
                  x1={r.nx}
                  x2={r.nx}
                  y1={r.y}
                  y2={r.y}
                  stroke={r.col}
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  transform={`translate(0,-${r.noticeMark})`}
                />
                <rect
                  x={r.nx}
                  y={r.y}
                  width={1.6}
                  height={r.noticeMark}
                  fill={r.col}
                  transform="translate(-0.8,-3)"
                />
                <circle
                  cx={r.cx}
                  cy={r.y}
                  r={r.r}
                  fill={r.col}
                  fillOpacity={0.82}
                  stroke={r.col}
                  strokeDasharray={r.dash}
                />
              </g>
            ))}
            <g>{tl.labels}</g>
          </svg>
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 20,
            alignItems: "center",
            padding: "8px 24px 14px",
          }}
        >
          {vm.urgLegend.map((l, i) => (
            <span
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: "#5f5e5a",
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: l.color,
                }}
              />
              {l.label}
            </span>
          ))}
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              color: "#5f5e5a",
            }}
          >
            <span
              style={{ width: 18, height: 0, borderTop: "2px dashed #5f5e5a" }}
            />
            Auto-renewing
          </span>
          <span style={{ fontSize: 12, color: "#5f5e5a" }}>
            Vertical tick marks the notice deadline; circle marks expiration.
          </span>
        </div>
        <div
          style={{
            borderTop: "1px solid rgba(10,10,11,.12)",
            background: "#fbfaf7",
            padding: "14px 24px",
            fontSize: 13,
            color: "#2c2c2a",
            lineHeight: 1.55,
          }}
        >
          {tl.laterNote}
        </div>
        <div
          style={{
            borderTop: "1px solid rgba(10,10,11,.12)",
            padding: "12px 24px",
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            alignItems: "center",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9.5,
            letterSpacing: ".06em",
            textTransform: "uppercase",
            color: "#b4b2a9",
          }}
        >
          <span>computeRenewalExposure(source.contract_360)</span>
          <span>·</span>
          <span>grain: active contract</span>
          <span>·</span>
          <span>drill: contract_id → Contract 360</span>
        </div>
      </div>

      <DataTable
        title="Notice deadline passed while the contract remains active"
        note="Contracts where the right to change price, scope or supplier has lapsed for this term."
        binding="computeRenewalExposure(source.contract_360).noticeDeadlinePassed"
        columns={vm.passedCols}
        rows={vm.passedRows}
        footnote="Notice deadlines are derived upstream from the executed end date and notice period at the governed as-of date — never from the browser clock."
      />
    </>
  );
}
