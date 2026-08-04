"use client";

import { DataTable } from "../DataTable";
import type { SourceWorkspaceVM } from "../buildViewModel";

export function ContractCanvas({ vm }: { vm: SourceWorkspaceVM }) {
  const c = vm.c;
  if (!c) return null;
  return (
    <>
      {vm.cOverview ? (
        <>
          {c.noticePassed ? (
            <div
              style={{
                background: "#fceded",
                border: "1px solid rgba(163,45,45,.28)",
                borderRadius: 8,
                padding: "18px 22px",
                display: "flex",
                flexWrap: "wrap",
                gap: 16,
                alignItems: "center",
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "#a32d2d",
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  fontSize: 13.5,
                  lineHeight: 1.55,
                  color: "#2c2c2a",
                  maxWidth: "96ch",
                }}
              >
                <b>Notice deadline passed</b> — {c.notice}. The contract remains
                active until {c.expiry}. The commercial lever for this term has
                lapsed; the available move is a variation or standstill, not a
                renewal negotiation.
              </div>
            </div>
          ) : null}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(400px,1fr))",
              gap: 16,
              alignItems: "start",
            }}
          >
            <div
              style={{
                background: "#fff",
                border: "1px solid rgba(10,10,11,.12)",
                borderRadius: 8,
                padding: "20px 24px",
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
                  marginBottom: 14,
                }}
              >
                Commercial terms · source.contract_360
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {vm.termRows.map((t, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 14,
                      alignItems: "baseline",
                      padding: "9px 0",
                      borderBottom: "1px solid rgba(10,10,11,.07)",
                    }}
                  >
                    <span
                      style={{ fontSize: 13, color: "#5f5e5a", minWidth: 150 }}
                    >
                      {t.label}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#0a0a0b",
                        flex: 1,
                      }}
                    >
                      {t.value}
                    </span>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 9.5,
                        color: "#b4b2a9",
                        textAlign: "right",
                      }}
                    >
                      {t.field}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div
              style={{
                background: "#fff",
                border: "1px solid rgba(10,10,11,.12)",
                borderRadius: 8,
                padding: "20px 24px",
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
                  marginBottom: 12,
                }}
              >
                Recommended action
              </div>
              <div
                style={{
                  fontSize: 14.5,
                  fontWeight: 600,
                  color: "#0a0a0b",
                  marginBottom: 8,
                }}
              >
                {vm.recAction}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#5f5e5a",
                  lineHeight: 1.6,
                  marginBottom: 14,
                }}
              >
                {vm.recWhy}
              </div>
              <button
                onClick={vm.goActions}
                style={{
                  border: "1px solid #0a0a0b",
                  background: "#0a0a0b",
                  color: "#fff",
                  borderRadius: 6,
                  padding: "10px 18px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Build optimisation strategy →
              </button>
            </div>
          </div>
        </>
      ) : null}

      {vm.cEconomics ? (
        <div
          style={{
            background: "#fff",
            border: "1px solid rgba(10,10,11,.12)",
            borderRadius: 8,
            padding: "22px 26px",
          }}
        >
          <div
            style={{
              fontSize: 14.5,
              fontWeight: 600,
              color: "#0a0a0b",
              marginBottom: 4,
            }}
          >
            Contracted value against actual spend
          </div>
          <div style={{ fontSize: 12.5, color: "#5f5e5a", marginBottom: 20 }}>
            Annual grain, from source.contract_360.annual_value /
            actual_annual_spend.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {vm.econBars.map((b, i) => (
              <div key={i}>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "baseline",
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 13, color: "#2c2c2a" }}>
                    {b.label}
                  </span>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: "#0a0a0b",
                    }}
                  >
                    {b.value}
                  </span>
                </div>
                <div
                  style={{
                    height: 14,
                    background: "#f1efe8",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${b.pct}%`,
                      background: b.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 18,
              padding: "14px 18px",
              background: "#faeeda",
              border: "1px solid rgba(186,117,23,.25)",
              borderRadius: 6,
              fontSize: 13,
              lineHeight: 1.6,
              color: "#2c2c2a",
            }}
          >
            The gap between contracted value and actual spend is either unused
            entitlement or timing. Source states the variance and withholds the
            cause until per-contract financial exposure detail is reviewed on
            the Performance tab.
          </div>
        </div>
      ) : null}

      {vm.cScope ? (
        <>
          <div
            style={{
              background: "#fff",
              border: "1px solid rgba(10,10,11,.12)",
              borderRadius: 8,
              padding: "20px 24px",
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: "#5f5e5a",
                lineHeight: 1.6,
                marginBottom: 12,
              }}
            >
              {c.scopeSummary}
            </div>
            {vm.scopeTierCounts ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {(
                  [
                    ["Explicit", vm.scopeTierCounts.explicit.length, "#0a0a0b"],
                    ["Reviewed", vm.scopeTierCounts.reviewed.length, "#3d6ea8"],
                    [
                      "Vendor-inferred",
                      vm.scopeTierCounts.vendorInferred.length,
                      "#ba7517",
                    ],
                    [
                      "Unresolved",
                      vm.scopeTierCounts.unresolved.length,
                      "#b4b2a9",
                    ],
                  ] as [string, number, string][]
                ).map(([label, n, color]) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 6,
                      fontSize: 12.5,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: color,
                        display: "inline-block",
                      }}
                    />
                    <span style={{ color: "#2c2c2a" }}>{label}</span>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        color: "#5f5e5a",
                      }}
                    >
                      {n}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          {vm.hasScope ? (
            <DataTable
              title="Application scope"
              note="tierApplicationScopeByConfidence — no explicit reference set loaded yet, so rows stay unresolved rather than upgraded."
              binding="source.contract_application_scope"
              columns={vm.scopeCols}
              rows={vm.scopeRows}
            />
          ) : (
            <div
              style={{
                background: "#fff",
                border: "1px solid rgba(10,10,11,.12)",
                borderRadius: 8,
                padding: "20px 24px",
                fontSize: 13,
                color: "#5f5e5a",
              }}
            >
              No application scope rows returned for this contract.
            </div>
          )}
          {vm.hasProg ? (
            <div
              style={{
                background: "#fff",
                border: "1px solid rgba(10,10,11,.12)",
                borderRadius: 8,
                padding: "20px 24px",
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
                  marginBottom: 14,
                }}
              >
                Transformation dependencies
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {vm.progRows.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 14,
                      alignItems: "baseline",
                      paddingBottom: 10,
                      borderBottom: "1px solid rgba(10,10,11,.07)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: "#0a0a0b",
                      }}
                    >
                      {p.name}
                    </span>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 9.5,
                        fontWeight: 600,
                        letterSpacing: ".08em",
                        textTransform: "uppercase",
                        color: p.color,
                        border: `1px solid ${p.color}`,
                        borderRadius: 3,
                        padding: "2px 7px",
                      }}
                    >
                      {p.status}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color: "#5f5e5a",
                        flex: 1,
                        minWidth: 300,
                      }}
                    >
                      {p.note}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {vm.cPerformance ? <DetailPanel vm={vm} kind="performance" /> : null}
      {vm.cEvidence ? <DetailPanel vm={vm} kind="evidence" /> : null}

      {vm.cRenewal ? (
        <div
          style={{
            background: "#fff",
            border: "1px solid rgba(10,10,11,.12)",
            borderRadius: 8,
            padding: "22px 26px",
          }}
        >
          <div
            style={{
              fontSize: 14.5,
              fontWeight: 600,
              color: "#0a0a0b",
              marginBottom: 18,
            }}
          >
            Decision timeline
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
              gap: 18,
            }}
          >
            <div
              style={{ borderLeft: `3px solid ${c.urgColor}`, paddingLeft: 14 }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: "#888780",
                  marginBottom: 5,
                }}
              >
                Notice deadline
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#0a0a0b" }}>
                {c.notice}
              </div>
              <div style={{ fontSize: 12.5, color: "#5f5e5a", marginTop: 4 }}>
                {c.noticeDays} before expiry
              </div>
            </div>
            <div
              style={{
                borderLeft: "3px solid rgba(10,10,11,.16)",
                paddingLeft: 14,
              }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: "#888780",
                  marginBottom: 5,
                }}
              >
                Expiration
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#0a0a0b" }}>
                {c.expiry}
              </div>
              <div style={{ fontSize: 12.5, color: "#5f5e5a", marginTop: 4 }}>
                Auto-renew: {c.auto}
              </div>
            </div>
            <div
              style={{
                borderLeft: "3px solid rgba(10,10,11,.16)",
                paddingLeft: 14,
              }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: "#888780",
                  marginBottom: 5,
                }}
              >
                Urgency state
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: c.urgColor }}>
                {c.urgency}
              </div>
            </div>
            <div
              style={{
                borderLeft: "3px solid rgba(10,10,11,.16)",
                paddingLeft: 14,
              }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: "#888780",
                  marginBottom: 5,
                }}
              >
                Renewal owner
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#0a0a0b" }}>
                {c.role}
              </div>
              <div style={{ fontSize: 12.5, color: "#5f5e5a", marginTop: 4 }}>
                renewal_owner_ref
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {vm.cLeverage ? (
        <div
          style={{
            background: "#fff",
            border: "1px solid rgba(10,10,11,.12)",
            borderRadius: 8,
            padding: "22px 26px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "baseline",
              gap: 14,
              marginBottom: 18,
            }}
          >
            <div style={{ fontSize: 14.5, fontWeight: 600, color: "#0a0a0b" }}>
              Leverage position
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                color: "#a32d2d",
              }}
            >
              {vm.weakCount} weak signals
            </div>
            <div style={{ fontSize: 12.5, color: "#5f5e5a" }}>
              Each signal is a named field returned by
              computeContractLeverageSignals. No composite score.
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
              gap: 12,
            }}
          >
            {vm.weakFlags.map((f, i) => (
              <div
                key={i}
                style={{
                  border: "1px solid rgba(10,10,11,.12)",
                  borderLeft: `3px solid ${f.color}`,
                  borderRadius: 6,
                  padding: "14px 16px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "baseline", gap: 10 }}
                >
                  <span
                    style={{
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: "#0a0a0b",
                    }}
                  >
                    {f.label}
                  </span>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9.5,
                      fontWeight: 600,
                      letterSpacing: ".06em",
                      textTransform: "uppercase",
                      color: f.color,
                    }}
                  >
                    {f.mark}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {vm.cActions ? (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
              gap: 14,
            }}
          >
            {vm.optLevers.map((l, i) => (
              <div
                key={i}
                style={{
                  background: "#fff",
                  border: "1px solid rgba(10,10,11,.12)",
                  borderRadius: 8,
                  padding: "16px 20px",
                }}
              >
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9.5,
                    fontWeight: 600,
                    letterSpacing: ".1em",
                    textTransform: "uppercase",
                    color: "#0066CC",
                    marginBottom: 10,
                  }}
                >
                  {l.label} levers
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {l.items.map((it, j) => (
                    <div
                      key={j}
                      style={{
                        fontSize: 12.5,
                        color: "#2c2c2a",
                        lineHeight: 1.5,
                        paddingLeft: 12,
                        borderLeft: "2px solid rgba(10,10,11,.12)",
                      }}
                    >
                      {it}
                    </div>
                  ))}
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
                padding: "18px 24px 14px",
                borderBottom: "1px solid rgba(10,10,11,.12)",
              }}
            >
              <div
                style={{ fontSize: 14.5, fontWeight: 600, color: "#0a0a0b" }}
              >
                Scenario comparison
              </div>
              <div style={{ fontSize: 12.5, color: "#5f5e5a", marginTop: 3 }}>
                No scenario carries a savings number, because none has been
                validated.
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              {vm.optScenarios.map((s, i) => (
                <div
                  key={i}
                  style={{
                    flex: "1 1 260px",
                    padding: "16px 20px",
                    borderTop: `3px solid ${s.tone}`,
                    borderRight: "1px solid rgba(10,10,11,.09)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 10,
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: "#0a0a0b",
                      }}
                    >
                      {s.name}
                    </div>
                    {s.rec ? (
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 9,
                          fontWeight: 600,
                          letterSpacing: ".08em",
                          textTransform: "uppercase",
                          color: "#0f6e56",
                          background: "#e1f5ee",
                          borderRadius: 3,
                          padding: "3px 7px",
                        }}
                      >
                        Recommended
                      </span>
                    ) : null}
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: "#2c2c2a",
                      lineHeight: 1.55,
                      marginBottom: 10,
                    }}
                  >
                    {s.pos}
                  </div>
                  <div
                    style={{ fontSize: 12, color: "#5f5e5a", lineHeight: 1.5 }}
                  >
                    <b style={{ color: "#2c2c2a" }}>Risk.</b> {s.risk}
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                padding: "16px 24px",
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 12.5, color: "#5f5e5a" }}>
                aVa reads the same governed data as this canvas. It cannot
                create a value, a date or a priority.
              </span>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}

function DetailPanel({
  vm,
  kind,
}: {
  vm: SourceWorkspaceVM;
  kind: "performance" | "evidence";
}) {
  if (vm.detailState === "loading" || vm.detailState === "idle") {
    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(10,10,11,.12)",
          borderRadius: 8,
          padding: "30px 34px",
          fontSize: 13,
          color: "#5f5e5a",
        }}
      >
        Loading{" "}
        {kind === "performance"
          ? "operational performance and financial exposure"
          : "document evidence"}{" "}
        for this contract…
      </div>
    );
  }
  if (vm.detailState === "error" || !vm.detail) {
    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(10,10,11,.12)",
          borderRadius: 8,
          padding: "30px 34px",
          fontSize: 13,
          color: "#5f5e5a",
        }}
      >
        Could not load per-contract detail from the governed data plane.
      </div>
    );
  }
  const d = vm.detail;
  if (kind === "performance") {
    const perf = d.operationalPerformance;
    const fin = d.financialExposure;
    if (!perf && !fin) {
      return (
        <div
          style={{
            background: "#fff",
            border: "1px solid rgba(10,10,11,.12)",
            borderRadius: 8,
            padding: "30px 34px",
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
              border: "1px solid rgba(10,10,11,.16)",
              borderRadius: 3,
              padding: "4px 9px",
            }}
          >
            Not returned
          </span>
          <h3
            style={{
              fontFamily: "Fraunces,Georgia,serif",
              fontWeight: 500,
              fontSize: 23,
              letterSpacing: "-0.02em",
              color: "#0a0a0b",
              margin: "18px 0 10px",
              maxWidth: "38ch",
            }}
          >
            No operational performance or financial exposure rows for this
            contract
          </h3>
          <p
            style={{
              fontSize: 14.5,
              lineHeight: 1.65,
              color: "#5f5e5a",
              margin: 0,
              maxWidth: "80ch",
            }}
          >
            source.contract_financial_exposure and
            source.contract_operational_performance returned nothing for
            contract_id={d.contract.contract_id}.
          </p>
        </div>
      );
    }
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
          gap: 16,
        }}
      >
        {fin ? (
          <div
            style={{
              background: "#fff",
              border: "1px solid rgba(10,10,11,.12)",
              borderRadius: 8,
              padding: "20px 24px",
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
                marginBottom: 12,
              }}
            >
              Financial exposure
            </div>
            {(
              [
                ["Linked budget", fin.linked_budget_amount],
                ["Linked forecast", fin.linked_forecast_amount],
                ["Linked actual", fin.linked_actual_amount],
                ["Linked committed", fin.linked_committed_amount],
              ] as [string, number | null][]
            ).map(([label, v]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  gap: 14,
                  alignItems: "baseline",
                  padding: "8px 0",
                  borderBottom: "1px solid rgba(10,10,11,.07)",
                }}
              >
                <span style={{ fontSize: 13, color: "#5f5e5a" }}>{label}</span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    fontWeight: 600,
                    color: v == null ? "#b4b2a9" : "#0a0a0b",
                  }}
                >
                  {v == null
                    ? "Not established"
                    : v.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 0,
                      })}
                </span>
              </div>
            ))}
          </div>
        ) : null}
        {perf ? (
          <div
            style={{
              background: "#fff",
              border: "1px solid rgba(10,10,11,.12)",
              borderRadius: 8,
              padding: "20px 24px",
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
                marginBottom: 12,
              }}
            >
              Operational performance
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#2c2c2a",
                lineHeight: 1.6,
                marginBottom: 10,
              }}
            >
              {perf.sla_summary ?? "No SLA summary recorded."}
            </div>
            {(
              [
                ["Sev1/Sev2 incidents", perf.cloud_sev1_sev2_incidents],
                ["Service credits earned", perf.service_credits_earned],
                ["Service credits claimed", perf.service_credits_claimed],
              ] as [string, number | null][]
            ).map(([label, v]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  gap: 14,
                  alignItems: "baseline",
                  padding: "8px 0",
                  borderBottom: "1px solid rgba(10,10,11,.07)",
                }}
              >
                <span style={{ fontSize: 13, color: "#5f5e5a" }}>{label}</span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    fontWeight: 600,
                    color: v == null ? "#b4b2a9" : "#0a0a0b",
                  }}
                >
                  {v == null ? "Not established" : v}
                </span>
              </div>
            ))}
            {perf.evidence_gap ? (
              <div style={{ fontSize: 12, color: "#ba7517", marginTop: 8 }}>
                evidence_gap: {String(perf.evidence_gap)}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }
  return (
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
          padding: "16px 24px 12px",
          borderBottom: "1px solid rgba(10,10,11,.12)",
          fontSize: 14.5,
          fontWeight: 600,
          color: "#0a0a0b",
        }}
      >
        Document evidence ({d.docExtractions.length})
      </div>
      {d.docExtractions.length ? (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {d.docExtractions.map((e) => (
            <div
              key={e.extraction_id}
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 14,
                alignItems: "baseline",
                padding: "13px 24px",
                borderBottom: "1px solid rgba(10,10,11,.07)",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#0a0a0b",
                  minWidth: 160,
                }}
              >
                {e.concept_ref}
              </span>
              <span
                style={{
                  fontSize: 12.5,
                  color: "#5f5e5a",
                  flex: 1,
                  minWidth: 240,
                }}
              >
                {e.value_text ??
                  (e.value_num != null
                    ? String(e.value_num)
                    : "No value extracted")}
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10.5,
                  color: "#b4b2a9",
                }}
              >
                {e.source_file_id ?? "—"}
                {e.source_page != null ? " · p." + e.source_page : ""}
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: e.review_state === "accepted" ? "#1d9e75" : "#ba7517",
                }}
              >
                {e.review_state ?? "unreviewed"}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: "20px 24px", fontSize: 13, color: "#5f5e5a" }}>
          No doc.extraction rows returned for this contract or its vendor.
        </div>
      )}
    </div>
  );
}
