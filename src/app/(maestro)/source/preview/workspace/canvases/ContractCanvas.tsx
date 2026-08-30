"use client";

import { Fragment, useState, type CSSProperties } from "react";
import { DataTable } from "../DataTable";
import { EvidenceLineageGraph } from "./EvidenceLineageGraph";
import type { SourceWorkspaceVM } from "../buildViewModel";

export function ContractCanvas({ vm }: { vm: SourceWorkspaceVM }) {
  const c = vm.c;
  if (!c) {
    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(163,45,45,.22)",
          borderRadius: 8,
          padding: "20px 24px",
        }}
      >
        <div
          style={{
            fontSize: 14.5,
            fontWeight: 800,
            color: "#0a0a0b",
            marginBottom: 8,
          }}
        >
          Contract view withheld
        </div>
        <div
          style={{
            fontSize: 13,
            lineHeight: 1.55,
            color: "#5f5e5a",
            maxWidth: "88ch",
          }}
        >
          {vm.thesis}
        </div>
        {vm.valueStrip.length ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
              gap: 10,
              marginTop: 16,
            }}
          >
            {vm.valueStrip.map((item) => (
              <div
                key={item.label}
                style={{
                  border: "1px solid rgba(10,10,11,.1)",
                  borderRadius: 6,
                  padding: "11px 13px",
                  background: "#fbfaf7",
                }}
              >
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9.5,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                    color: "#888780",
                    marginBottom: 5,
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontSize: item.size,
                    fontWeight: 800,
                    color: item.color,
                    lineHeight: 1.1,
                  }}
                >
                  {item.value}
                </div>
                <div style={{ fontSize: 11.5, color: "#5f5e5a", marginTop: 5 }}>
                  {item.sub}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  }
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
          <ContractActionStoryPanel vm={vm} />
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
                display: "grid",
                gridTemplateColumns: "minmax(0,1fr) auto",
                gap: 20,
                alignItems: "start",
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9.5,
                    fontWeight: 800,
                    letterSpacing: ".1em",
                    textTransform: "uppercase",
                    color: "#0f6e56",
                    marginBottom: 8,
                  }}
                >
                  Scope overview
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: "#2c2c2a",
                    lineHeight: 1.55,
                    maxWidth: "92ch",
                  }}
                >
                  {c.scopeSummary}
                </div>
                {c.businessFunctions.length || c.systemsServices.length ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                      gap: 10,
                      marginTop: 14,
                    }}
                  >
                    {c.businessFunctions.length ? (
                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: "#5f5e5a",
                            marginBottom: 6,
                          }}
                        >
                          Business functions
                        </div>
                        <div
                          style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
                        >
                          {c.businessFunctions.map((item) => (
                            <span
                              key={item}
                              style={{
                                border: "1px solid rgba(10,10,11,.1)",
                                borderRadius: 5,
                                padding: "5px 7px",
                                fontSize: 11.5,
                                color: "#2c2c2a",
                                background: "#fbfaf7",
                              }}
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {c.systemsServices.length ? (
                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: "#5f5e5a",
                            marginBottom: 6,
                          }}
                        >
                          Systems and services
                        </div>
                        <div
                          style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
                        >
                          {c.systemsServices.map((item) => (
                            <span
                              key={item}
                              style={{
                                border: "1px solid rgba(10,10,11,.1)",
                                borderRadius: 5,
                                padding: "5px 7px",
                                fontSize: 11.5,
                                color: "#2c2c2a",
                                background: "#fbfaf7",
                              }}
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {c.overviewSource || c.refreshFrequency ? (
                  <div
                    style={{ fontSize: 11.8, color: "#888780", marginTop: 12 }}
                  >
                    Source: {c.overviewSource ?? "contract evidence package"}
                    {c.refreshFrequency
                      ? ` · Refresh: ${c.refreshFrequency}`
                      : ""}
                  </div>
                ) : null}
              </div>
              {vm.hasScope && vm.scopeTierCounts ? (
                <div
                  style={{
                    border: "1px solid rgba(10,10,11,.1)",
                    borderRadius: 6,
                    padding: "10px 12px",
                    minWidth: 170,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9,
                      letterSpacing: ".08em",
                      textTransform: "uppercase",
                      color: "#888780",
                      marginBottom: 5,
                    }}
                  >
                    Scope evidence
                  </div>
                  <div
                    style={{ fontSize: 18, fontWeight: 800, color: "#0a0a0b" }}
                  >
                    {vm.scopeRows.length} rows
                  </div>
                  <div
                    style={{ fontSize: 11.5, color: "#5f5e5a", marginTop: 3 }}
                  >
                    {vm.scopeTierCounts.explicit.length} explicit ·{" "}
                    {vm.scopeTierCounts.reviewed.length} reviewed ·{" "}
                    {vm.scopeTierCounts.unresolved.length} unresolved
                  </div>
                </div>
              ) : null}
            </div>
            {!vm.hasScope ? (
              <div
                style={{
                  marginTop: 14,
                  padding: "11px 13px",
                  border: "1px solid rgba(186,117,23,.25)",
                  borderRadius: 6,
                  background: "#fff8ec",
                  fontSize: 12.5,
                  lineHeight: 1.5,
                  color: "#6d420c",
                }}
              >
                Scope coverage is not available yet. The next upload should
                include the agreement/SOW scope schedule, product or service
                line items, and the application or owner mapping used by the
                client.
              </div>
            ) : null}
          </div>
          {vm.hasScope ? (
            <DataTable
              title="Systems and services in scope"
              note={
                vm.hasEvidenceScope
                  ? "Loaded from the contract evidence package at contract-to-application/function grain."
                  : "These rows describe applications, services, products, functions, and run-cost elements. Confidence stays visible where the source does not prove the link."
              }
              binding={
                vm.hasEvidenceScope
                  ? "source.golden_contract_application_scope"
                  : "source.contract_application_scope"
              }
              columns={vm.scopeCols}
              rows={vm.scopeRows}
            />
          ) : c.scopedApplicationCount ? (
            <div
              style={{
                background: "#fff",
                border: "1px solid rgba(10,10,11,.12)",
                borderRadius: 8,
                padding: "18px 24px",
              }}
            >
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 800,
                  color: "#0a0a0b",
                  marginBottom: 6,
                }}
              >
                Scope rollup exists, but the line-item table is not loaded
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: "#5f5e5a",
                  lineHeight: 1.55,
                  maxWidth: "86ch",
                }}
              >
                The contract rollup reports {c.scopedApplicationCount} scoped
                application/service links, but the detail feed returned zero
                rows for this selected contract. Until the agreement/SOW
                schedule and application-owner mapping are loaded at line-item
                grain, this page should not pretend to know the contract scope.
              </div>
            </div>
          ) : null}
          {vm.hasScope && vm.hasProg ? (
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
                Related initiatives
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {vm.progRows.slice(0, 4).map((p, i) => (
                  <div
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(180px,.35fr) minmax(0,1fr)",
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
                      style={{ fontSize: 13, color: "#5f5e5a", minWidth: 0 }}
                    >
                      {p.note}
                    </span>
                  </div>
                ))}
              </div>
              {vm.progRows.length > 4 ? (
                <div style={{ fontSize: 12, color: "#888780", marginTop: 10 }}>
                  Dependency signals only. They do not replace the scope line
                  item feed.
                </div>
              ) : null}
            </div>
          ) : !vm.hasScope && vm.hasProg ? (
            <div
              style={{
                background: "#fff",
                border: "1px solid rgba(10,10,11,.12)",
                borderRadius: 8,
                padding: "18px 24px",
              }}
            >
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 800,
                  color: "#0a0a0b",
                  marginBottom: 6,
                }}
              >
                Dependency signals are available, but hidden from scope until
                scope is proven
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: "#5f5e5a",
                  lineHeight: 1.55,
                  maxWidth: "86ch",
                }}
              >
                {vm.progRows.length} initiative dependency signal
                {vm.progRows.length === 1 ? "" : "s"} exist for this contract,
                but they are not contract scope. Load the scope schedule and
                product/service line items first; then dependencies can explain
                impact.
              </div>
            </div>
          ) : null}
          {vm.hasPricing ? (
            <DataTable
              title="Pricing and commercial line items"
              note="These line items explain what makes up the annual contract value; they are not optimization savings by themselves."
              binding="source.golden_contract_pricing_schedule"
              columns={vm.pricingCols}
              rows={vm.pricingRows}
            />
          ) : null}
        </>
      ) : null}

      {vm.cPerformance ? <DetailPanel vm={vm} kind="performance" /> : null}
      {vm.cRelationship ? <ContractRelationshipCanvas vm={vm} /> : null}
      {vm.cEvidence ? (
        <>
          <DetailPanel vm={vm} kind="evidence" />
          <EvidenceLineageGraph vm={vm} />
        </>
      ) : null}

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
          {vm.opportunityView ? (
            <OpportunityCockpit vm={vm} />
          ) : vm.optLedger ? (
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
                  padding: "18px 24px",
                  borderBottom: "1px solid rgba(10,10,11,.1)",
                  display: "flex",
                  gap: 18,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <div style={{ flex: "1 1 520px", minWidth: 280 }}>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9.5,
                      fontWeight: 600,
                      letterSpacing: ".1em",
                      textTransform: "uppercase",
                      color: "#0f6e56",
                      marginBottom: 7,
                    }}
                  >
                    Opportunity evidence cockpit
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#0a0a0b",
                      marginBottom: 5,
                    }}
                  >
                    {vm.optLedger.headline}
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      lineHeight: 1.55,
                      color: "#5f5e5a",
                    }}
                  >
                    Recoverable opportunity, avoidable opportunity, negotiable
                    improvement, and finance-confirmed outcome stay separate.
                    Governed extracts and documents can start the cockpit; APIs
                    can replace repeat feeds later.
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {[
                    ["Recoverable opportunity", vm.optLedger.quantifiedLeakage],
                    ["Finance confirmed", vm.optLedger.realizedValue],
                    ["Evidence gaps", vm.optLedger.evidenceGaps],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        minWidth: 118,
                        border: "1px solid rgba(10,10,11,.1)",
                        borderRadius: 6,
                        padding: "10px 12px",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 9,
                          letterSpacing: ".08em",
                          textTransform: "uppercase",
                          color: "#888780",
                          marginBottom: 5,
                        }}
                      >
                        {label}
                      </div>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#0a0a0b",
                        }}
                      >
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={vm.startOptimization}
                  disabled={vm.optCtaDisabled}
                  style={{
                    border: "1px solid #0a0a0b",
                    background: vm.optCtaDisabled ? "#5f5e5a" : "#0a0a0b",
                    color: "#fff",
                    borderRadius: 6,
                    padding: "11px 16px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: vm.optCtaDisabled ? "wait" : "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {vm.optCtaLabel}
                </button>
                {vm.optCtaError ? (
                  <div
                    style={{
                      flexBasis: "100%",
                      color: "#a32d2d",
                      fontSize: 12.5,
                      lineHeight: 1.5,
                    }}
                  >
                    {vm.optCtaError}
                  </div>
                ) : null}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))",
                }}
              >
                {vm.optLedger.lines.map((line) => (
                  <div
                    key={line.id}
                    style={{
                      padding: "16px 20px",
                      borderRight: "1px solid rgba(10,10,11,.08)",
                      borderBottom: "1px solid rgba(10,10,11,.08)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start",
                        marginBottom: 9,
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: line.tone,
                          flexShrink: 0,
                          marginTop: 5,
                        }}
                      />
                      <span
                        style={{
                          fontSize: 13.5,
                          fontWeight: 700,
                          color: "#0a0a0b",
                          lineHeight: 1.35,
                          minWidth: 0,
                        }}
                      >
                        {line.label}
                      </span>
                      <span
                        style={{
                          marginLeft: "auto",
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: ".08em",
                          textTransform: "uppercase",
                          color: line.tone,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {line.state}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                        alignItems: "center",
                        marginBottom: 10,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 9,
                          fontWeight: 800,
                          letterSpacing: ".08em",
                          textTransform: "uppercase",
                          color: line.evidenceTone,
                          border: `1px solid ${line.evidenceTone}`,
                          borderRadius: 4,
                          padding: "3px 7px",
                          background: "#fff",
                        }}
                      >
                        {line.evidenceClass}
                      </span>
                    </div>
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 18,
                        fontWeight: 700,
                        color: "#0a0a0b",
                        marginBottom: 9,
                      }}
                    >
                      {line.amount}
                    </div>
                    <div
                      style={{
                        fontSize: 12.5,
                        color: "#2c2c2a",
                        lineHeight: 1.55,
                        marginBottom: 10,
                      }}
                    >
                      {line.evidence}
                    </div>
                    <div
                      style={{
                        fontSize: 12.5,
                        color: "#5f5e5a",
                        lineHeight: 1.55,
                        marginBottom: 10,
                      }}
                    >
                      <b style={{ color: "#2c2c2a" }}>Next.</b>{" "}
                      {line.nextAction}
                    </div>
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 9,
                        letterSpacing: ".08em",
                        textTransform: "uppercase",
                        color: "#888780",
                        marginBottom: 6,
                      }}
                    >
                      Drilldown lineage
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                        marginBottom: 10,
                      }}
                    >
                      {line.lineageFields.slice(0, 5).map((field) => (
                        <span
                          key={field}
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 9.5,
                            color: "#5f5e5a",
                            background: "#fff",
                            border: "1px solid rgba(10,10,11,.1)",
                            borderRadius: 3,
                            padding: "3px 6px",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {field}
                        </span>
                      ))}
                      {line.lineageFields.length > 5 ? (
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 9.5,
                            color: "#888780",
                            background: "#fff",
                            border: "1px solid rgba(10,10,11,.08)",
                            borderRadius: 3,
                            padding: "3px 6px",
                          }}
                        >
                          +{line.lineageFields.length - 5} more
                        </span>
                      ) : null}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {line.sourceRefs.slice(0, 3).map((ref) => (
                        <span
                          key={ref}
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 9.5,
                            color: "#5f5e5a",
                            background: "#f5f1eb",
                            border: "1px solid rgba(10,10,11,.08)",
                            borderRadius: 3,
                            padding: "3px 6px",
                          }}
                        >
                          {ref}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {!vm.opportunityView ? <SourceSystemEvidenceMap vm={vm} /> : null}

          {!vm.opportunityView ? (
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
                      color: "#0f6e56",
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
          ) : null}

          {!vm.opportunityView ? (
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
                      style={{
                        fontSize: 12,
                        color: "#5f5e5a",
                        lineHeight: 1.5,
                      }}
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
          ) : null}
        </>
      ) : null}
    </>
  );
}

function OpportunityCockpit({ vm }: { vm: SourceWorkspaceVM }) {
  const view = vm.opportunityView;
  if (!view) return null;
  const selected = view.selectedOpportunity;
  const hasCalculation = Boolean(selected?.calculation);
  const included = view.calculationLines.filter(
    (line) => line.inclusionRaw === "included",
  );
  const pending = view.calculationLines.filter(
    (line) => line.inclusionRaw === "pending_review",
  );
  const excluded = view.calculationLines.filter(
    (line) => line.inclusionRaw === "excluded",
  );
  const sourceRefs = selected?.sourceRefs.slice(0, 6) ?? [];
  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid rgba(10,10,11,.12)",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "16px 20px",
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) auto",
          gap: 18,
          alignItems: "start",
          borderBottom: "1px solid rgba(10,10,11,.1)",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 850,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              color: "#0f6e56",
              marginBottom: 7,
            }}
          >
            Optimization opportunity cockpit
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 850,
              color: "#0a0a0b",
              lineHeight: 1.25,
              marginBottom: 6,
            }}
          >
            {selected ? selected.label : view.recommendation}
          </div>
          <div
            style={{
              fontSize: 12.7,
              lineHeight: 1.5,
              color: "#5f5e5a",
              maxWidth: "94ch",
            }}
          >
            {selected?.narrative ?? view.recommendationDetail}
          </div>
        </div>
        <button
          onClick={vm.startOptimization}
          disabled={vm.optCtaDisabled}
          style={{
            border: "1px solid #0a0a0b",
            background: vm.optCtaDisabled ? "#5f5e5a" : "#0a0a0b",
            color: "#fff",
            borderRadius: 6,
            padding: "10px 14px",
            fontSize: 12.5,
            fontWeight: 800,
            cursor: vm.optCtaDisabled ? "wait" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {vm.optCtaLabel}
        </button>
        {vm.optCtaError ? (
          <div
            style={{
              gridColumn: "1 / -1",
              color: "#a32d2d",
              fontSize: 12.5,
              lineHeight: 1.5,
            }}
          >
            {vm.optCtaError}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(300px,.8fr) minmax(0,1.2fr)",
        }}
      >
        <div
          style={{
            padding: "15px 18px",
            borderRight: "1px solid rgba(10,10,11,.08)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
              gap: 8,
              marginBottom: 14,
            }}
          >
            <SmallMetric
              label="Amount"
              value={selected?.amount ?? "Not sized"}
              tone={selected?.tone ?? "#0a0a0b"}
            />
            <SmallMetric
              label="Stage"
              value={selected?.stage ?? view.actionState}
            />
            <SmallMetric
              label="Evidence"
              value={selected?.grade ?? "Not established"}
            />
            <SmallMetric
              label="Finance confirmed"
              value={view.financeConfirmed}
              tone="#246b45"
            />
          </div>
          <div
            style={{
              border: "1px solid rgba(10,10,11,.1)",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {view.opportunities.map((opportunity) => (
              <div
                key={opportunity.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0,1fr) auto",
                  gap: 10,
                  padding: "10px 12px",
                  borderBottom: "1px solid rgba(10,10,11,.07)",
                  background: opportunity.selected ? "#f6fbf9" : "#fff",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12.3,
                      fontWeight: 850,
                      color: "#0a0a0b",
                      lineHeight: 1.25,
                    }}
                  >
                    {opportunity.label}
                  </div>
                  <div style={{ fontSize: 11, color: "#5f5e5a", marginTop: 3 }}>
                    {opportunity.stage} · {opportunity.grade}
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11.5,
                    fontWeight: 850,
                    color: "#0a0a0b",
                  }}
                >
                  {opportunity.amount}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "15px 18px", minWidth: 0 }}>
          {hasCalculation && selected?.calculation ? (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <SmallMetric
                  label="Formula result"
                  value={selected.calculation.calculatedAmount}
                />
                <SmallMetric
                  label="Included lines"
                  value={String(selected.calculation.includedLineCount)}
                />
                <SmallMetric
                  label="Pending review"
                  value={String(selected.calculation.pendingLineCount)}
                  tone="#ba7517"
                />
                <SmallMetric
                  label="Excluded lines"
                  value={String(selected.calculation.excludedLineCount)}
                />
              </div>
              <div
                style={{
                  border: "1px solid rgba(10,10,11,.1)",
                  borderRadius: 8,
                  padding: "11px 12px",
                  background: "#fbfaf7",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10.5,
                    fontWeight: 850,
                    color: "#0a0a0b",
                    marginBottom: 5,
                  }}
                >
                  {selected.calculation.ruleId} · v
                  {selected.calculation.ruleVersion}
                </div>
                <div
                  style={{ fontSize: 12.2, color: "#2c2c2a", lineHeight: 1.45 }}
                >
                  {selected.calculation.formula}
                </div>
              </div>
              <OpportunityLineTable
                title="Included invoice lines"
                rows={included}
              />
              {pending.length ? (
                <OpportunityLineTable
                  title="Pending-review lines"
                  rows={pending}
                  tone="#ba7517"
                />
              ) : null}
              {excluded.length ? (
                <OpportunityLineTable
                  title="Excluded sample"
                  rows={excluded.slice(0, 6)}
                  tone="#888780"
                />
              ) : null}
            </>
          ) : (
            <div
              style={{
                border: "1px solid rgba(10,10,11,.1)",
                borderRadius: 8,
                padding: "14px 16px",
                background: "#fbfaf7",
                fontSize: 12.5,
                color: "#5f5e5a",
                lineHeight: 1.5,
              }}
            >
              {selected?.blockingGap ?? view.baseline.detail}
            </div>
          )}
          {sourceRefs.length ? (
            <div style={{ marginTop: 12 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 850,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                  color: "#888780",
                  marginBottom: 7,
                }}
              >
                Evidence references
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {sourceRefs.map((ref) => (
                  <span
                    key={ref}
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9.5,
                      color: "#5f5e5a",
                      border: "1px solid rgba(10,10,11,.1)",
                      borderRadius: 4,
                      padding: "4px 6px",
                      background: "#fff",
                      maxWidth: 360,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {ref}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div
        style={{
          padding: "13px 18px",
          borderTop: "1px solid rgba(10,10,11,.08)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
          gap: 10,
          background: "#fbfaf7",
        }}
      >
        <div style={{ fontSize: 12.2, color: "#5f5e5a", lineHeight: 1.45 }}>
          <b style={{ color: "#0a0a0b" }}>Next action:</b>{" "}
          {selected?.nextAction ?? view.recommendationDetail}
        </div>
        <div style={{ fontSize: 12.2, color: "#5f5e5a", lineHeight: 1.45 }}>
          <b style={{ color: "#0a0a0b" }}>Approval state:</b>{" "}
          {selected?.approvalState ?? view.actionState}
        </div>
        <div style={{ fontSize: 12.2, color: "#5f5e5a", lineHeight: 1.45 }}>
          <b style={{ color: "#0a0a0b" }}>Overlap:</b>{" "}
          {selected?.overlapTreatment ??
            "No opportunity value is approved until evidence is resolved."}
        </div>
      </div>
    </section>
  );
}

function OpportunityLineTable({
  title,
  rows,
  tone = "#1d9e75",
}: {
  title: string;
  rows: NonNullable<SourceWorkspaceVM["opportunityView"]>["calculationLines"];
  tone?: string;
}) {
  if (!rows.length) return null;
  return (
    <div
      style={{
        marginBottom: 12,
        border: "1px solid rgba(10,10,11,.1)",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "9px 11px",
          background: "#fff",
          borderBottom: "1px solid rgba(10,10,11,.08)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{ width: 7, height: 7, borderRadius: "50%", background: tone }}
        />
        <span style={{ fontSize: 12.2, fontWeight: 850, color: "#0a0a0b" }}>
          {title}
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: "#888780",
          }}
        >
          {rows.length} lines
        </span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}
        >
          <thead>
            <tr>
              {[
                "Invoice line",
                "Period",
                "SKU/service",
                "Qty",
                "Billed",
                "Contract",
                "Amount",
                "Why",
              ].map((header) => (
                <th
                  key={header}
                  style={{
                    textAlign:
                      header === "Qty" ||
                      header === "Billed" ||
                      header === "Contract" ||
                      header === "Amount"
                        ? "right"
                        : "left",
                    padding: "8px 10px",
                    fontSize: 10,
                    color: "#888780",
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                    borderBottom: "1px solid rgba(10,10,11,.08)",
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={`${row.invoiceLineId}-${row.inclusionRaw}-${row.amount}`}
              >
                <td style={tdStyle}>
                  <b>{row.invoiceLineId}</b>
                  <div style={subStyle}>{row.invoiceId}</div>
                </td>
                <td style={tdStyle}>{row.servicePeriod}</td>
                <td style={tdStyle}>
                  {row.skuOrService}
                  <div style={subStyle}>{row.pricingScheduleRef}</div>
                </td>
                <td style={{ ...tdStyle, textAlign: "right" }}>
                  {row.quantity}
                  <div style={subStyle}>{row.unitOfMeasure}</div>
                </td>
                <td style={{ ...tdStyle, textAlign: "right" }}>
                  {row.billedRate}
                </td>
                <td style={{ ...tdStyle, textAlign: "right" }}>
                  {row.contractRate}
                </td>
                <td style={{ ...tdStyle, textAlign: "right", fontWeight: 850 }}>
                  {row.amount}
                </td>
                <td style={tdStyle}>
                  {row.inclusionReason}
                  <div style={subStyle}>{row.quantityBasis}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const tdStyle: CSSProperties = {
  padding: "8px 10px",
  borderBottom: "1px solid rgba(10,10,11,.06)",
  fontSize: 11.5,
  color: "#2c2c2a",
  verticalAlign: "top",
};

const subStyle: CSSProperties = {
  marginTop: 3,
  fontSize: 10.2,
  color: "#888780",
  lineHeight: 1.35,
};

function ContractActionStoryPanel({ vm }: { vm: SourceWorkspaceVM }) {
  const spine = vm.optSpine;
  if (!spine?.selected) return null;
  const c = vm.c;
  if (vm.detailState === "loading" || vm.detailState === "idle") {
    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(10,10,11,.12)",
          borderRadius: 8,
          padding: "18px 22px",
        }}
      >
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            color: "#0f6e56",
            marginBottom: 8,
          }}
        >
          Selected contract decision story
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: "#0a0a0b",
            marginBottom: 6,
          }}
        >
          Loading governed contract evidence.
        </div>
        <div
          style={{
            fontSize: 13,
            lineHeight: 1.55,
            color: "#5f5e5a",
            maxWidth: 760,
          }}
        >
          AbarVa is assembling the agreement facts, scope rows, service
          evidence, invoice exceptions, and finance confirmation before stating
          the optimization case. The page should not claim evidence is missing
          or unavailable while the contract detail read is still in flight.
        </div>
      </div>
    );
  }
  if (vm.detailState === "error") {
    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(163,45,45,.22)",
          borderRadius: 8,
          padding: "18px 22px",
        }}
      >
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            color: "#a32d2d",
            marginBottom: 8,
          }}
        >
          Selected contract decision story
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: "#0a0a0b",
            marginBottom: 6,
          }}
        >
          Contract evidence could not be loaded.
        </div>
        <div
          style={{
            fontSize: 13,
            lineHeight: 1.55,
            color: "#5f5e5a",
            maxWidth: 760,
          }}
        >
          Retry the contract or check the Source detail API before using this
          page in an executive conversation.
        </div>
      </div>
    );
  }
  if (vm.opportunityView) return <OpportunityStoryPanel vm={vm} />;
  const evidenceReady = vm.optLedger
    ? `${vm.optLedger.evidenceReady} ready · ${vm.optLedger.evidenceGaps} gap${vm.optLedger.evidenceGaps === "1" ? "" : "s"}`
    : "Not established";
  const missingLines =
    vm.optLedger?.lines.filter((line) => line.evidenceClass === "MISSING") ??
    [];
  const quantifiedLines =
    vm.optLedger?.lines.filter((line) => line.state === "Quantified") ?? [];
  const workflowLines =
    vm.optLedger?.lines.filter((line) => line.state === "Workflow required") ??
    [];
  const ledgerSupport = quantifiedLines.length
    ? quantifiedLines.map((line) => `${line.label}: ${line.amount}`).join(" · ")
    : "No quantified opportunity evidence line is established yet.";
  const runwayText = c
    ? c.noticePassed
      ? `Notice deadline has passed (${c.notice}); the commercial choice is remediation or a controlled variation, not a clean renewal cycle.`
      : c.urgency?.toLowerCase().includes("monitor")
        ? `The renewal date is not the urgency trigger (${c.notice} notice, ${c.expiry} expiry). The reason to act now is evidence readiness plus material value; the long runway lets Procurement prepare properly.`
        : `A renewal or notice decision is inside the active window (${c.notice} notice, ${c.expiry} expiry), so the evidence pack should move before leverage decays.`
    : "Timing is not established.";
  const qaGuardrail = c
    ? `Do not treat ${c.spend} actual spend below ${c.acv} contracted value as savings by itself. It becomes a finding only after usage, entitlement, invoice, and finance evidence classify the cause.`
    : "Do not convert variance into value without supporting evidence.";
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
          padding: "18px 22px",
          display: "grid",
          gridTemplateColumns: "minmax(0,1.1fr) minmax(300px,.9fr)",
          gap: 18,
          alignItems: "start",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              color: "#0f6e56",
              marginBottom: 8,
            }}
          >
            Selected contract decision story
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 9,
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 20,
                fontWeight: 800,
                color: "#0a0a0b",
              }}
            >
              {spine.selected.rank}
            </span>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#0a0a0b" }}>
              {spine.selected.band}
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                color: "#5f5e5a",
                border: "1px solid rgba(10,10,11,.14)",
                borderRadius: 999,
                padding: "4px 8px",
              }}
            >
              fit {spine.selected.score}/100
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: "#5f5e5a",
              }}
            >
              {spine.selected.annualValue} annual
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: "#5f5e5a",
              }}
            >
              {evidenceReady}
            </span>
          </div>
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.55,
              color: "#2c2c2a",
              marginBottom: 12,
            }}
          >
            {spine.selected.action} This page explains why this contract is
            actionable; portfolio ranking stays in the portfolio view.
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(min(230px,100%),1fr))",
              gap: 8,
            }}
          >
            <StoryTile
              index="01"
              title="Why this contract is in scope"
              body={
                spine.selected.reasons[0]?.detail ??
                `${spine.selected.annualValue} annual exposure and a governed fit score of ${spine.selected.score}/100.`
              }
            />
            <StoryTile
              index="02"
              title="Why now, precisely"
              body={runwayText}
            />
            <StoryTile
              index="03"
              title="What supports the case"
              body={ledgerSupport}
            />
            <StoryTile
              index="04"
              title="What is missing"
              body={
                missingLines.length
                  ? `${missingLines.length} missing line${missingLines.length === 1 ? "" : "s"}: ${missingLines.map((line) => line.label).join("; ")}.`
                  : "No missing evidence lines remain for this contract; remaining work is decision workflow and value attestation."
              }
            />
          </div>
        </div>
        <div>
          <div
            style={{
              border: "1px solid rgba(10,10,11,.1)",
              borderRadius: 8,
              padding: "13px 14px",
              background: "#fbfaf7",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                color: "#0f6e56",
                marginBottom: 8,
              }}
            >
              Executive QA read
            </div>
            <div style={{ fontSize: 12.5, color: "#2c2c2a", lineHeight: 1.55 }}>
              Ranking is a prioritization signal, not a recommendation to sign.
              It is based on material exposure, governed opportunity evidence,
              dependency context, and any active decision timing.
            </div>
          </div>
          <div
            style={{
              border: "1px solid rgba(10,10,11,.1)",
              borderRadius: 8,
              padding: "13px 14px",
              background: "#fff",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 800,
                color: "#0a0a0b",
                marginBottom: 6,
              }}
            >
              Evidence posture
            </div>
            <div style={{ fontSize: 12.2, color: "#5f5e5a", lineHeight: 1.55 }}>
              {workflowLines.length
                ? `${workflowLines.length} opportunity line${workflowLines.length === 1 ? " still requires" : "s still require"} workflow action before ${workflowLines.length === 1 ? "it becomes" : "they become"} finance-confirmed.`
                : "The evidence pack can support a fact-based commercial conversation; finance-confirmed outcome still requires Finance/Tower confirmation."}
            </div>
          </div>
          <div
            style={{
              border: "1px solid rgba(10,10,11,.1)",
              borderRadius: 8,
              padding: "13px 14px",
              background: "#fff",
            }}
          >
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 800,
                color: "#0a0a0b",
                marginBottom: 6,
              }}
            >
              Guardrail
            </div>
            <div style={{ fontSize: 12.2, color: "#5f5e5a", lineHeight: 1.55 }}>
              {qaGuardrail}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StoryTile({
  index,
  title,
  body,
}: {
  index: string;
  title: string;
  body: string;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(10,10,11,.1)",
        borderRadius: 6,
        padding: "10px 12px",
        background: "#fbfaf7",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "baseline",
          marginBottom: 5,
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9.5,
            fontWeight: 800,
            color: "#0f6e56",
          }}
        >
          {index}
        </span>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: "#0a0a0b" }}>
          {title}
        </span>
      </div>
      <div style={{ fontSize: 11.7, color: "#5f5e5a", lineHeight: 1.45 }}>
        {body}
      </div>
    </div>
  );
}

function sentenceCount(count: number) {
  if (count === 0) return "No";
  if (count === 1) return "One";
  if (count === 2) return "Two";
  if (count === 3) return "Three";
  if (count === 4) return "Four";
  if (count === 5) return "Five";
  return String(count);
}

function pluralOpportunity(count: number) {
  return count === 1 ? "opportunity" : "opportunities";
}

function OpportunityStoryPanel({ vm }: { vm: SourceWorkspaceVM }) {
  const view = vm.opportunityView;
  if (!view) return null;
  const c = vm.c;
  const selectedSpine = vm.optSpine?.selected ?? null;
  const conflict = view.baseline.status === "conflict";
  const visibleOpportunities = view.opportunities.slice(0, 5);
  const blockedCount = view.opportunities.filter(
    (opportunity) =>
      opportunity.stageRaw === "baseline_conflict" ||
      opportunity.stageRaw === "evidence_required" ||
      Boolean(opportunity.blockingGap),
  ).length;
  const hasSizedPotential = view.potential.total !== "Not sized";
  const scoreReasons = selectedSpine?.reasons ?? [];
  const actionTriggers = scoreReasons.filter(
    (reason) => reason.role === "action_trigger",
  );
  const supportSignals = scoreReasons.filter(
    (reason) => reason.role === "supporting_context",
  );
  const evidenceGates = scoreReasons.filter(
    (reason) => reason.role === "evidence_gate",
  );
  const baselineHeadline =
    !conflict && c ? "Contract economics loaded" : view.baseline.headline;
  const baselineDetail =
    !conflict && c
      ? "Annual value and actual spend are available; pricing schedule baseline still needs reconciliation."
      : view.baseline.detail;
  const baselineRows =
    !conflict && c
      ? [
          ["Annual contract value", c.acv],
          ["Actual annual spend", c.spend],
          [
            "Pricing schedule baseline",
            view.baseline.pricingScheduleValue === "Not sized"
              ? "Not reconciled"
              : view.baseline.pricingScheduleValue,
          ],
        ]
      : [
          ["Annual value", view.baseline.annualValue],
          ["Pricing schedule", view.baseline.pricingScheduleValue],
          ["Actual spend", view.baseline.actualSpend],
        ];
  const evidenceRead =
    blockedCount === 0
      ? `${sentenceCount(view.opportunities.length)} opportunities identified. None still require evidence review, business approval, or negotiation action. Missing evidence remains explicit.`
      : `${sentenceCount(view.opportunities.length)} opportunities identified. ${sentenceCount(blockedCount)} still require evidence review, business approval, or negotiation action. Missing evidence remains explicit.`;
  const decisionHeadline = conflict
    ? "Reconcile the commercial baseline before sizing value."
    : hasSizedPotential
      ? `Act now: ${view.potential.total} in governed potential value is ready for an optimization plan.`
      : "Start with evidence collection before sizing value.";
  const decisionDetail = conflict
    ? `${view.baseline.detail} AbarVa should block savings, recovery, and realized-value language until the baseline conflict is reviewed.`
    : `${c?.vendor ?? view.contractId} has material annual exposure${c?.acv ? ` (${c.acv})` : ""} and ${view.opportunities.length} identified ${pluralOpportunity(view.opportunities.length)}. Potential value remains separate from the ${view.financeConfirmed} finance-confirmed outcome.`;
  const timingRead = conflict
    ? "The timing trigger is the baseline conflict, not renewal urgency."
    : actionTriggers.length > 0
      ? actionTriggers.map((reason) => reason.detail).join(" ")
      : c?.notice && c?.expiry
      ? `Notice ${c.notice}; expiry ${c.expiry}. Timing informs the workflow, but the case is driven by evidence and materiality.`
      : "Timing is governed by the loaded contract terms when available.";
  const rankRead = selectedSpine
    ? `${selectedSpine.rank} of the current optimization queue with fit ${selectedSpine.score}/100. ${
        supportSignals.length > 0
          ? supportSignals.map((reason) => reason.detail).join(" ")
          : "Materiality is the supporting context; it is not a value claim."
      }`
    : c
      ? `${c.vendor} contract ${view.contractId}; ${c.acv} annual value and ${c.spend} actual spend.`
      : `Contract ${view.contractId}.`;
  const evidenceGateRead =
    evidenceGates.length > 0
      ? evidenceGates.map((reason) => reason.detail).join(" ")
      : "No ranking evidence gate is suppressing the next decision; use the opportunity rows for remaining workflow state.";
  const categoryLabel = (valueType: string) => {
    if (valueType === "Recoverable Leakage") return "Recover money";
    if (valueType === "Avoided Cost") return "Avoid future spend";
    if (valueType === "Negotiable Improvement") return "Improve the deal";
    return valueType;
  };
  const nextAction = conflict
    ? "Resolve annual-value and pricing-schedule disagreement, then re-run the opportunity calculation."
    : (view.selectedOpportunity?.nextAction ??
      "Open the optimization workflow, confirm baseline ownership, review evidence, and move to approval.");
  return (
    <section
      style={{
        background: "#fff",
        border: `1px solid ${conflict ? "rgba(163,45,45,.22)" : "rgba(10,10,11,.12)"}`,
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "16px 20px",
          display: "grid",
          gridTemplateColumns: "minmax(0,1.15fr) minmax(320px,.85fr)",
          gap: 16,
          alignItems: "start",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: conflict ? "#a32d2d" : "#0f6e56",
              letterSpacing: ".08em",
              textTransform: "uppercase",
              marginBottom: 7,
            }}
          >
            Executive opening
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 850,
              color: "#0a0a0b",
              lineHeight: 1.24,
              marginBottom: 7,
            }}
          >
            {decisionHeadline}
          </div>
          <div
            style={{
              fontSize: 12.7,
              lineHeight: 1.5,
              color: "#5f5e5a",
              maxWidth: "94ch",
            }}
          >
            {decisionDetail}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(min(210px,100%),1fr))",
              gap: 8,
              marginTop: 13,
            }}
          >
            <StoryTile
              index="01"
              title="Why this contract first"
              body={rankRead}
            />
            <StoryTile index="02" title="Action trigger" body={timingRead} />
            <StoryTile
              index="03"
              title="Where value sits"
              body={`${view.opportunities.length} ${pluralOpportunity(view.opportunities.length)}: recover money, avoid future spend, or improve the deal. Finance confirmation is shown separately.`}
            />
            <StoryTile
              index="04"
              title="Proof standard"
              body={conflict ? view.baseline.headline : evidenceGateRead}
            />
            <StoryTile index="05" title="Next decision" body={`${evidenceRead} ${nextAction}`} />
          </div>
        </div>
        <div>
          <div
            style={{
              border: "1px solid rgba(10,10,11,.1)",
              borderRadius: 8,
              padding: "12px 14px",
              background: conflict ? "#fff8ec" : "#fbfaf7",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 850,
                color: "#0a0a0b",
                marginBottom: 5,
              }}
            >
              {baselineHeadline}
            </div>
            <div
              style={{
                fontSize: 11.8,
                lineHeight: 1.45,
                color: "#5f5e5a",
                marginBottom: 10,
              }}
            >
              {baselineDetail}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                rowGap: 5,
                columnGap: 12,
                fontSize: 11.5,
              }}
            >
              {baselineRows.map(([label, value]) => (
                <Fragment key={label}>
                  <span style={{ color: "#5f5e5a" }}>{label}</span>
                  <b>{value}</b>
                </Fragment>
              ))}
              {view.baseline.conflictAmount ? (
                <>
                  <span style={{ color: "#a32d2d" }}>Conflict</span>
                  <b style={{ color: "#a32d2d" }}>
                    {view.baseline.conflictAmount}
                  </b>
                </>
              ) : null}
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2,minmax(0,1fr))",
              gap: 8,
            }}
          >
            <SmallMetric
              label="Recover money"
              value={view.potential.recoverable}
            />
            <SmallMetric
              label="Avoid future spend"
              value={view.potential.avoidable}
            />
            <SmallMetric
              label="Improve the deal"
              value={view.potential.negotiable}
            />
            <SmallMetric
              label="Finance confirmed"
              value={view.financeConfirmed}
              tone="#246b45"
            />
          </div>
        </div>
      </div>
      <div
        style={{
          borderTop: "1px solid rgba(10,10,11,.1)",
          padding: "12px 16px 14px",
          background: "#fbfaf7",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <div style={{ fontSize: 12.5, fontWeight: 850, color: "#0a0a0b" }}>
            Opportunity queue
          </div>
          <div style={{ fontSize: 11.5, color: "#5f5e5a" }}>
            Fact-backed lines only; values are potential until workflow and
            finance prove outcome.
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
            gap: 8,
          }}
        >
          {visibleOpportunities.map((opportunity) => (
            <div
              key={opportunity.id}
              style={{
                padding: "11px 12px",
                border: "1px solid rgba(10,10,11,.1)",
                borderRadius: 7,
                background: opportunity.selected ? "#f6fbf9" : "#fff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: opportunity.tone,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 12.7,
                    fontWeight: 850,
                    color: "#0a0a0b",
                    lineHeight: 1.3,
                  }}
                >
                  {opportunity.shortLabel}
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10.5,
                    fontWeight: 800,
                    color: "#0a0a0b",
                  }}
                >
                  {opportunity.amount}
                </span>
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: "#5f5e5a",
                  lineHeight: 1.4,
                  marginBottom: 7,
                }}
              >
                {categoryLabel(opportunity.valueType)} · {opportunity.stage} ·{" "}
                {opportunity.grade}
              </div>
              <div
                style={{ fontSize: 11.5, color: "#2c2c2a", lineHeight: 1.4 }}
              >
                {opportunity.blockingGap
                  ? opportunity.blockingGap
                  : opportunity.nextAction}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SmallMetric({
  label,
  value,
  tone = "#0a0a0b",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(10,10,11,.1)",
        borderRadius: 7,
        padding: "9px 10px",
        background: "#fff",
      }}
    >
      <div
        style={{
          fontSize: 9.5,
          fontWeight: 800,
          color: "#888780",
          letterSpacing: ".08em",
          textTransform: "uppercase",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 14,
          fontWeight: 850,
          color: tone,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ContractRelationshipCanvas({ vm }: { vm: SourceWorkspaceVM }) {
  if (vm.opportunityView) return <OpportunityRelationshipCanvas vm={vm} />;
  return (
    <>
      <ContractJourneyGraph vm={vm} />
      <ValueProofExplainer vm={vm} />
      <SourceSystemEvidenceMap vm={vm} />
    </>
  );
}

function OpportunityRelationshipCanvas({ vm }: { vm: SourceWorkspaceVM }) {
  const view = vm.opportunityView;
  const contract = vm.contractRow;
  const [active, setActive] = useState("invoice");
  if (!view || !contract) return null;
  const baselineAnnual =
    view.baseline.annualValue === "Not sized" && vm.c?.acv
      ? vm.c.acv
      : view.baseline.annualValue;
  const sources = [
    {
      id: "clm",
      label: "Agreement PDF",
      sub: "terms, scope, pricing schedule",
      feeds: "baseline + negotiated terms",
      detail:
        "The executed agreement and clause extraction prove scope, pricing authority, benchmark language, notice terms, and renewal rights.",
    },
    {
      id: "pricing",
      label: "Pricing schedule",
      sub: view.baseline.pricingScheduleValue,
      feeds: "contract rate",
      detail:
        "Commercial line items reconcile to the annual baseline for CTR-090; CTR-061 is intentionally blocked when they do not reconcile.",
    },
    {
      id: "invoice",
      label: "AP invoice lines",
      sub: `${view.selectedOpportunity?.calculation?.includedLineCount ?? 0} included rate lines`,
      feeds: "rate variance + off-contract billing",
      detail:
        "Invoice number, line, service period, SKU, billed rate, contract rate, and exception amount drive the recoverable opportunity.",
    },
    {
      id: "sla",
      label: "ITSM SLA history",
      sub: "24 monthly rows",
      feeds: "service credits",
      detail:
        "Monthly service evidence quantifies earned, claimed, and received credits; entitlement review still controls recovery.",
    },
    {
      id: "usage",
      label: "Usage entitlement",
      sub: "seat/service utilization",
      feeds: "scope rationalization",
      detail:
        "Usage and entitlement rows support reduction hypotheses, but business owners must approve reclaim eligibility.",
    },
    {
      id: "finance",
      label: "Finance / Tower",
      sub: view.financeConfirmed,
      feeds: "finance-confirmed outcome",
      detail:
        "Finance confirmation is linked to originating opportunities; it is not added to potential value.",
    },
  ];
  const activeSource =
    sources.find((source) => source.id === active) ?? sources[0];
  const tone = view.baseline.status === "conflict" ? "#a32d2d" : "#1d9e75";
  const sourceNode = (
    source: (typeof sources)[number],
    x: number,
    y: number,
  ) => (
    <g
      key={source.id}
      onMouseEnter={() => setActive(source.id)}
      onFocus={() => setActive(source.id)}
      onClick={() => setActive(source.id)}
      style={{ cursor: "pointer" }}
      tabIndex={0}
    >
      <rect
        x={x}
        y={y}
        width="152"
        height="58"
        rx="10"
        fill={active === source.id ? "#eff8f5" : "#fff"}
        stroke={active === source.id ? "#1d9e75" : "rgba(10,10,11,.22)"}
      />
      <text x={x + 13} y={y + 22} fontSize="12" fontWeight="850" fill="#0a0a0b">
        {source.label}
      </text>
      <text x={x + 13} y={y + 41} fontSize="10.5" fill="#5f5e5a">
        {source.sub}
      </text>
    </g>
  );
  const arrow = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    stroke = "#b4b2a9",
  ) => (
    <path
      d={`M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`}
      fill="none"
      stroke={stroke}
      strokeWidth="1.6"
      markerEnd="url(#relArrow)"
    />
  );
  return (
    <>
      <section
        style={{
          background: "#fff",
          border: "1px solid rgba(10,10,11,.12)",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "13px 16px",
            borderBottom: "1px solid rgba(10,10,11,.1)",
            display: "flex",
            alignItems: "baseline",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 850, color: "#0a0a0b" }}>
            Contract relationship
          </div>
          <div style={{ fontSize: 12.2, color: "#5f5e5a" }}>
            Click a source block to see what feeds the baseline, opportunity
            evidence, and finance-confirmed outcome.
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(620px,1.35fr) minmax(330px,.65fr)",
          }}
        >
          <div style={{ padding: 16, minWidth: 0 }}>
            <svg
              viewBox="0 0 980 430"
              role="img"
              aria-label="Source evidence to contract opportunity flow"
              style={{ width: "100%", height: "auto", display: "block" }}
            >
              <defs>
                <marker
                  id="relArrow"
                  markerWidth="8"
                  markerHeight="8"
                  refX="7"
                  refY="4"
                  orient="auto"
                >
                  <path d="M 0 0 L 8 4 L 0 8 z" fill="#9a9890" />
                </marker>
                <filter
                  id="relShadow"
                  x="-10%"
                  y="-15%"
                  width="120%"
                  height="135%"
                >
                  <feDropShadow
                    dx="0"
                    dy="8"
                    stdDeviation="8"
                    floodColor="#0a0a0b"
                    floodOpacity=".08"
                  />
                </filter>
                <linearGradient id="relBand" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#fbfaf7" />
                  <stop offset="52%" stopColor="#eef8f5" />
                  <stop offset="100%" stopColor="#eef4fb" />
                </linearGradient>
              </defs>
              <rect
                x="0"
                y="0"
                width="980"
                height="430"
                rx="18"
                fill="#fbfaf7"
              />
              <rect
                x="216"
                y="34"
                width="540"
                height="318"
                rx="24"
                fill="url(#relBand)"
                stroke="rgba(10,10,11,.08)"
              />
              <text
                x="24"
                y="28"
                fontSize="10"
                fontWeight="850"
                letterSpacing=".12em"
                fill="#888780"
              >
                SOURCE SYSTEMS
              </text>
              <text
                x="292"
                y="28"
                fontSize="10"
                fontWeight="850"
                letterSpacing=".12em"
                fill="#888780"
              >
                GOVERNED CONTRACT READ
              </text>
              <text
                x="790"
                y="28"
                fontSize="10"
                fontWeight="850"
                letterSpacing=".12em"
                fill="#888780"
              >
                ACTION
              </text>

              {sourceNode(sources[0], 24, 52)}
              {sourceNode(sources[1], 24, 126)}
              {sourceNode(sources[2], 24, 200)}
              {sourceNode(sources[3], 24, 274)}
              {sourceNode(sources[4], 24, 348)}
              {sourceNode(sources[5], 790, 260)}

              {arrow(176, 81, 278, 138)}
              {arrow(176, 155, 278, 138)}
              {arrow(176, 229, 278, 240)}
              {arrow(176, 303, 278, 240)}
              {arrow(176, 377, 278, 240)}
              {arrow(492, 188, 586, 188, tone)}
              {arrow(728, 188, 790, 165, tone)}
              {arrow(728, 220, 790, 289, "#246b45")}

              <g filter="url(#relShadow)">
                <rect
                  x="278"
                  y="92"
                  width="214"
                  height="192"
                  rx="18"
                  fill="#0a0a0b"
                />
                <text
                  x="300"
                  y="126"
                  fontSize="12"
                  fontWeight="850"
                  fill="#fff"
                >
                  Contract baseline
                </text>
                <text
                  x="300"
                  y="154"
                  fontSize="24"
                  fontWeight="900"
                  fill="#fff"
                >
                  {contract.contract_id}
                </text>
                <text
                  x="300"
                  y="182"
                  fontSize="12"
                  fill="rgba(255,255,255,.72)"
                >
                  {baselineAnnual} annual
                </text>
                <text
                  x="300"
                  y="203"
                  fontSize="11"
                  fill={
                    view.baseline.status === "conflict"
                      ? "#ffd5c8"
                      : "rgba(255,255,255,.68)"
                  }
                >
                  {view.baseline.headline}
                </text>
                <text
                  x="300"
                  y="232"
                  fontSize="10.5"
                  fill="rgba(255,255,255,.58)"
                >
                  Pricing schedule {view.baseline.pricingScheduleValue}
                </text>
              </g>

              <g filter="url(#relShadow)">
                <rect
                  x="586"
                  y="80"
                  width="142"
                  height="216"
                  rx="16"
                  fill="#fff"
                  stroke={tone}
                  strokeWidth="1.4"
                />
                <text
                  x="606"
                  y="112"
                  fontSize="12"
                  fontWeight="850"
                  fill="#0a0a0b"
                >
                  Opportunities
                </text>
                {view.opportunities.slice(0, 5).map((opportunity, index) => (
                  <g key={opportunity.id}>
                    <circle
                      cx="608"
                      cy={142 + index * 27}
                      r="4"
                      fill={opportunity.tone}
                    />
                    <text
                      x="620"
                      y={146 + index * 27}
                      fontSize="10.4"
                      fontWeight="750"
                      fill="#0a0a0b"
                    >
                      {opportunity.shortLabel}
                    </text>
                  </g>
                ))}
              </g>

              <g filter="url(#relShadow)">
                <rect
                  x="790"
                  y="112"
                  width="154"
                  height="74"
                  rx="12"
                  fill="#fff"
                  stroke="#0a0a0b"
                  strokeWidth="1.3"
                />
                <text
                  x="808"
                  y="140"
                  fontSize="12.5"
                  fontWeight="850"
                  fill="#0a0a0b"
                >
                  Optimize case
                </text>
                <text x="808" y="162" fontSize="10.5" fill="#5f5e5a">
                  {view.actionState}
                </text>
              </g>
              <g filter="url(#relShadow)">
                <rect
                  x="790"
                  y="258"
                  width="154"
                  height="74"
                  rx="12"
                  fill="#fff"
                  stroke="#246b45"
                  strokeWidth="1.3"
                />
                <text
                  x="808"
                  y="286"
                  fontSize="12.5"
                  fontWeight="850"
                  fill="#0a0a0b"
                >
                  Finance / Tower
                </text>
                <text x="808" y="308" fontSize="10.5" fill="#5f5e5a">
                  {view.financeConfirmed} confirmed
                </text>
              </g>

              <text x="24" y="414" fontSize="10.5" fill="#5f5e5a">
                Relationship flow only. Potential, target, and finance-confirmed
                value stay separate.
              </text>
            </svg>
          </div>
          <aside
            style={{
              borderLeft: "1px solid rgba(10,10,11,.1)",
              padding: "16px 18px",
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 850,
                color: "#0a0a0b",
                marginBottom: 5,
              }}
            >
              {activeSource.label}
            </div>
            <div
              style={{
                fontSize: 11.8,
                fontWeight: 800,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                color: "#888780",
                marginBottom: 9,
              }}
            >
              {activeSource.feeds}
            </div>
            <div
              style={{
                fontSize: 12.4,
                color: "#2c2c2a",
                lineHeight: 1.5,
                marginBottom: 13,
              }}
            >
              {activeSource.detail}
            </div>
            <div
              style={{
                border: "1px solid rgba(10,10,11,.1)",
                borderRadius: 7,
                padding: "10px 12px",
                background: "#fbfaf7",
              }}
            >
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 850,
                  color: "#0a0a0b",
                  marginBottom: 6,
                }}
              >
                Selected opportunity
              </div>
              <div style={{ fontSize: 12, color: "#5f5e5a", lineHeight: 1.45 }}>
                {view.selectedOpportunity
                  ? `${view.selectedOpportunity.label}: ${view.selectedOpportunity.amount}, ${view.selectedOpportunity.stage}.`
                  : "No selected opportunity."}
              </div>
            </div>
          </aside>
        </div>
      </section>
      <OpportunityValueEvidenceExplainer vm={vm} />
    </>
  );
}

function OpportunityValueEvidenceExplainer({ vm }: { vm: SourceWorkspaceVM }) {
  const view = vm.opportunityView;
  if (!view) return null;
  const rows = [
    [
      "Recoverable opportunity",
      view.potential.recoverable,
      "Money that can be recovered or stopped when invoice, SLA, or rate evidence proves leakage.",
    ],
    [
      "Avoidable opportunity",
      view.potential.avoidable,
      "Future spend not incurred after approved scope, usage, or commitment reduction.",
    ],
    [
      "Negotiable opportunity",
      view.potential.negotiable,
      "A vendor-facing target or approved position. It is not savings until agreed and confirmed.",
    ],
    [
      "Finance-confirmed value",
      view.financeConfirmed,
      "Booked or accepted value linked back to originating opportunities; never added to potential.",
    ],
  ];
  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid rgba(10,10,11,.12)",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "13px 16px",
          borderBottom: "1px solid rgba(10,10,11,.1)",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 850, color: "#0a0a0b" }}>
          Opportunity evidence, not a single savings number
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
        }}
      >
        {rows.map(([label, amount, text]) => (
          <div
            key={label}
            style={{
              padding: "13px 16px",
              borderRight: "1px solid rgba(10,10,11,.08)",
              borderBottom: "1px solid rgba(10,10,11,.08)",
            }}
          >
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 850,
                color: "#0a0a0b",
                marginBottom: 4,
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13.5,
                fontWeight: 850,
                color: "#0a0a0b",
                marginBottom: 7,
              }}
            >
              {amount}
            </div>
            <div style={{ fontSize: 11.8, lineHeight: 1.45, color: "#5f5e5a" }}>
              {text}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ValueProofExplainer({ vm }: { vm: SourceWorkspaceVM }) {
  const lines = vm.optLedger?.lines ?? [];
  const valueProofDefs = [
    [
      "recoverable_leakage",
      "Recoverable opportunity",
      "Money that should come back or stop because contract, invoice, SLA, or rate-card evidence proves overbilling, missed credits, duplicates, or off-contract spend.",
    ],
    [
      "avoided_cost",
      "Avoidable opportunity",
      "Future spend not incurred because scope, shelfware, renewal uplift, or consumption is reduced before the commitment is made.",
    ],
    [
      "negotiated_improvement",
      "Negotiable improvement",
      "Commercial gains from price, term, index cap, volume tier, benchmark right, or termination leverage after the supplier agrees or the negotiation packet is approved.",
    ],
    [
      "realized_value",
      "Finance-confirmed outcome",
      "Finance-confirmed value only. It is not the same thing as estimated opportunity, usage variance, or a procurement target.",
    ],
  ];
  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid rgba(10,10,11,.12)",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid rgba(10,10,11,.1)",
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: "#0a0a0b",
            marginBottom: 4,
          }}
        >
          How Source separates value
        </div>
        <div style={{ fontSize: 12.5, color: "#5f5e5a", lineHeight: 1.5 }}>
          Opportunity, target, and finance-confirmed outcome stay separate. This
          prevents a forecast or data gap from becoming a claimed saving.
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(280px,100%),1fr))",
        }}
      >
        {valueProofDefs.map(([kind, label, definition]) => {
          const matchingLines = lines.filter((line) => line.kind === kind);
          const amount =
            matchingLines
              .map((line) => line.amount)
              .find((value) => value && value !== "Not established") ??
            "Not established";
          return (
            <div
              key={label}
              style={{
                padding: "14px 16px",
                borderRight: "1px solid rgba(10,10,11,.08)",
                borderBottom: "1px solid rgba(10,10,11,.08)",
              }}
            >
              <div
                style={{
                  fontSize: 12.8,
                  fontWeight: 800,
                  color: "#0a0a0b",
                  marginBottom: 5,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#0a0a0b",
                  marginBottom: 7,
                }}
              >
                {amount}
              </div>
              <div
                style={{ fontSize: 11.8, color: "#5f5e5a", lineHeight: 1.45 }}
              >
                {definition}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ContractJourneyGraph({ vm }: { vm: SourceWorkspaceVM }) {
  const spine = vm.optSpine;
  const ledger = vm.optLedger;
  const contract = vm.contractRow;
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null);
  if (!spine?.selected || !ledger || !contract) return null;

  const readyLines = ledger.lines.filter(
    (line) => line.state === "Quantified" || line.state === "Workflow required",
  );
  const gapLines = ledger.lines.filter(
    (line) =>
      line.state === "Needs evidence" || line.evidenceClass === "MISSING",
  );
  const sourceConnections = spine.sourceConnections.slice(0, 6);
  const activeSource =
    sourceConnections.find((connection) => connection.id === activeSourceId) ??
    sourceConnections[0] ??
    null;
  const scopeCount = contract.scoped_application_count ?? 0;
  const proofStatus = gapLines.length
    ? `${readyLines.length} supported · ${gapLines.length} gaps`
    : `${readyLines.length} supported · no gaps`;
  const node = (
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    sub: string,
    tone: string,
    fill = "#fff",
  ) => (
    <g filter="url(#softShadow)">
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="10"
        fill={fill}
        stroke={tone}
        strokeWidth="1.4"
      />
      <text
        x={x + 14}
        y={y + 23}
        fontSize="12.5"
        fontWeight="800"
        fill="#0a0a0b"
      >
        {label}
      </text>
      <text x={x + 14} y={y + 44} fontSize="10.5" fill="#5f5e5a">
        {sub}
      </text>
    </g>
  );
  const line = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    tone = "#b4b2a9",
  ) => (
    <path
      d={`M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`}
      fill="none"
      stroke={tone}
      strokeWidth="1.7"
      markerEnd="url(#arrow)"
    />
  );
  const chip = (
    x: number,
    y: number,
    label: string,
    value: string,
    tone: string,
  ) => (
    <g>
      <rect
        x={x}
        y={y}
        width="132"
        height="42"
        rx="8"
        fill="#fff"
        stroke="rgba(10,10,11,.1)"
      />
      <circle cx={x + 15} cy={y + 21} r="5" fill={tone} />
      <text
        x={x + 27}
        y={y + 17}
        fontSize="9.2"
        fontWeight="800"
        letterSpacing=".08em"
        fill="#888780"
      >
        {label.toUpperCase()}
      </text>
      <text
        x={x + 27}
        y={y + 32}
        fontSize="10.8"
        fontWeight="800"
        fill="#0a0a0b"
      >
        {value}
      </text>
    </g>
  );

  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid rgba(10,10,11,.12)",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 18px 10px",
          borderBottom: "1px solid rgba(10,10,11,.1)",
          display: "flex",
          alignItems: "baseline",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 800, color: "#0a0a0b" }}>
          Contract relationship
        </div>
        <div style={{ fontSize: 12.2, color: "#5f5e5a" }}>
          Follow the contract from source systems and scope facts to opportunity
          evidence and the optimize decision.
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(520px,1.1fr) minmax(360px,.9fr)",
          gap: 0,
        }}
      >
        <div style={{ minWidth: 0, padding: "14px 16px" }}>
          <svg
            viewBox="0 0 940 390"
            role="img"
            aria-label="Contract journey relationship graph"
            style={{ width: "100%", height: "auto", display: "block" }}
          >
            <defs>
              <marker
                id="arrow"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <path d="M 0 0 L 8 4 L 0 8 z" fill="#9a9890" />
              </marker>
              <filter
                id="softShadow"
                x="-10%"
                y="-15%"
                width="120%"
                height="135%"
              >
                <feDropShadow
                  dx="0"
                  dy="7"
                  stdDeviation="7"
                  floodColor="#0a0a0b"
                  floodOpacity=".08"
                />
              </filter>
              <linearGradient id="journeyBand" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#f7f3ea" />
                <stop offset="50%" stopColor="#eff7f5" />
                <stop offset="100%" stopColor="#eef4fb" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="940" height="390" rx="14" fill="#fbfaf7" />
            <rect
              x="28"
              y="42"
              width="884"
              height="220"
              rx="18"
              fill="url(#journeyBand)"
              stroke="rgba(10,10,11,.08)"
            />
            <text
              x="44"
              y="28"
              fontSize="10"
              fontWeight="800"
              letterSpacing=".12em"
              fill="#888780"
            >
              CONTRACT JOURNEY
            </text>
            <text
              x="44"
              y="284"
              fontSize="10"
              fontWeight="800"
              letterSpacing=".12em"
              fill="#888780"
            >
              OPPORTUNITY EVIDENCE
            </text>

            {line(172, 88, 285, 116, "#0a0a0b")}
            {line(172, 162, 285, 132, scopeCount ? "#0f6e56" : "#ba7517")}
            {line(172, 226, 285, 152, "#ba7517")}
            {line(425, 138, 520, 138, "#0a0a0b")}
            {line(658, 138, 735, 138, gapLines.length ? "#ba7517" : "#1d9e75")}

            {node(38, 58, 134, 58, "Agreement", "PDF / CLM terms", "#0a0a0b")}
            {node(
              38,
              132,
              134,
              58,
              "Scope facts",
              `${scopeCount} apps / services`,
              scopeCount ? "#0f6e56" : "#ba7517",
            )}
            {node(
              38,
              196,
              134,
              58,
              "Source systems",
              `${sourceConnections.length} feeds mapped`,
              "#ba7517",
            )}

            <g filter="url(#softShadow)">
              <rect
                x="285"
                y="78"
                width="140"
                height="104"
                rx="16"
                fill="#0a0a0b"
              />
              <text x="305" y="108" fontSize="12" fontWeight="800" fill="#fff">
                Contract 360
              </text>
              <text x="305" y="130" fontSize="18" fontWeight="900" fill="#fff">
                {contract.contract_id}
              </text>
              <text x="305" y="153" fontSize="11" fill="rgba(255,255,255,.72)">
                {formatCurrency(contract.annual_value ?? null)} annual
              </text>
              <text x="305" y="170" fontSize="10" fill="rgba(255,255,255,.58)">
                {spine.selected.score}/100 fit score
              </text>
            </g>

            {node(
              520,
              86,
              138,
              104,
              "Opportunity evidence",
              proofStatus,
              gapLines.length ? "#ba7517" : "#1d9e75",
              "#fff",
            )}
            {node(
              735,
              78,
              160,
              104,
              "Optimize plan",
              spine.selected.band,
              "#0a0a0b",
              "#fff",
            )}

            {ledger.lines.slice(0, 4).map((item, i) => {
              const x = 44 + i * 152;
              const color =
                item.evidenceClass === "MISSING"
                  ? "#a32d2d"
                  : item.state === "Quantified"
                    ? "#1d9e75"
                    : "#ba7517";
              return chip(
                x,
                302,
                item.label.length > 17
                  ? `${item.label.slice(0, 16)}...`
                  : item.label,
                item.amount,
                color,
              );
            })}
            <text x="44" y="370" fontSize="10.5" fill="#5f5e5a">
              The map shows relationship flow and evidence readiness. It does
              not infer savings; amounts come only from governed evidence rows.
            </text>
            <text
              x="828"
              y="370"
              fontSize="10.5"
              fontWeight="800"
              textAnchor="end"
              fill={gapLines.length ? "#ba7517" : "#1d9e75"}
            >
              {gapLines.length
                ? `${gapLines.length} evidence gap${gapLines.length === 1 ? "" : "s"}`
                : "evidence complete"}
            </text>
          </svg>
        </div>
        <div
          style={{
            borderLeft: "1px solid rgba(10,10,11,.1)",
            padding: "14px 16px",
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: "#0a0a0b",
              marginBottom: 4,
            }}
          >
            Source systems in this map
          </div>
          <div
            style={{
              fontSize: 11.8,
              color: "#5f5e5a",
              lineHeight: 1.45,
              marginBottom: 10,
            }}
          >
            Hover or click a feed to see what it contributes to the opportunity
            case.
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
              gap: 7,
              marginBottom: 10,
            }}
          >
            {sourceConnections.slice(0, 5).map((connection) => (
              <button
                key={connection.id}
                type="button"
                onMouseEnter={() => setActiveSourceId(connection.id)}
                onFocus={() => setActiveSourceId(connection.id)}
                onClick={() => setActiveSourceId(connection.id)}
                style={{
                  textAlign: "left",
                  border: `1px solid ${activeSource?.id === connection.id ? "#1d9e75" : "rgba(10,10,11,.09)"}`,
                  borderRadius: 6,
                  padding: "9px 10px",
                  background:
                    activeSource?.id === connection.id ? "#eff8f5" : "#fff",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "baseline", gap: 8 }}
                >
                  <span
                    style={{
                      fontSize: 12.2,
                      fontWeight: 800,
                      color: "#0a0a0b",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {connection.sourceSystem}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    color: "#888780",
                    marginTop: 4,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {connection.ledgers.map(formatValueProofKind).join(" · ")}
                </div>
              </button>
            ))}
          </div>
          {activeSource ? (
            <div
              style={{
                border: "1px solid rgba(10,10,11,.1)",
                borderRadius: 8,
                padding: "12px 13px",
                background: "#fff",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#0a0a0b",
                  marginBottom: 5,
                }}
              >
                {activeSource.sourceSystem}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#2c2c2a",
                  lineHeight: 1.45,
                  marginBottom: 8,
                }}
              >
                {activeSource.extract}
              </div>
              <div
                style={{
                  fontSize: 11.8,
                  color: "#5f5e5a",
                  lineHeight: 1.45,
                  marginBottom: 8,
                }}
              >
                {activeSource.outcome}
              </div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {activeSource.fields.slice(0, 6).map((field) => (
                  <span
                    key={field}
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9.3,
                      color: "#5f5e5a",
                      border: "1px solid rgba(10,10,11,.1)",
                      borderRadius: 4,
                      padding: "3px 5px",
                      background: "#fbfaf7",
                    }}
                  >
                    {field}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function formatValueProofKind(kind?: string) {
  if (!kind) return "Evidence";
  return kind.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatCurrency(value: number | null) {
  if (value == null) return "Not established";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  const trim = (raw: string) => raw.replace(/\.0+$/, "");
  if (abs >= 1_000_000_000) {
    return `${sign}$${trim(
      (abs / 1_000_000_000).toFixed(abs >= 10_000_000_000 ? 1 : 2),
    )}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}$${trim(
      (abs / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 2),
    )}M`;
  }
  if (abs >= 1_000) {
    return `${sign}$${Math.round(abs / 1_000).toLocaleString("en-US")}K`;
  }
  return `${sign}$${abs.toLocaleString("en-US", {
    maximumFractionDigits: 0,
  })}`;
}

function formatMonth(value: string | null | undefined) {
  if (!value) return "Not established";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function SourceSystemEvidenceMap({ vm }: { vm: SourceWorkspaceVM }) {
  const spine = vm.optSpine;
  if (!spine) return null;
  const requirements = spine.missingEvidenceSources ?? [];
  const sourceConnections = spine.sourceConnections ?? [];
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid rgba(10,10,11,.12)",
        borderRadius: 8,
        padding: "20px 22px",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "flex-end",
          marginBottom: 16,
        }}
      >
        <div style={{ flex: "1 1 420px" }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              color: "#0f6e56",
              marginBottom: 6,
            }}
          >
            How the evidence is sourced
          </div>
          <div
            style={{
              fontSize: 12.5,
              color: "#5f5e5a",
              lineHeight: 1.5,
              maxWidth: 760,
            }}
          >
            This contract shows the governed feeds that establish the
            opportunity case, plus any remaining extracts needed to move the
            decision.
          </div>
        </div>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10.5,
            color: "#5f5e5a",
          }}
        >
          {requirements.length
            ? `${requirements.length} gap${requirements.length === 1 ? "" : "s"} to source`
            : `${sourceConnections.length} governed feed${sourceConnections.length === 1 ? "" : "s"}`}
        </div>
      </div>
      {requirements.length ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(340px,100%),1fr))",
            gap: 10,
          }}
        >
          {requirements.map((requirement) => (
            <div
              key={requirement.lineId}
              style={{
                border: "1px solid rgba(10,10,11,.1)",
                borderRadius: 8,
                padding: "12px 14px",
                background: "#fbfaf7",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#0a0a0b",
                  marginBottom: 5,
                }}
              >
                {requirement.lineLabel}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#2c2c2a",
                  lineHeight: 1.45,
                  marginBottom: 8,
                }}
              >
                {requirement.ask}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {requirement.connections.map((connection) => (
                  <div
                    key={connection.id}
                    style={{
                      borderLeft: "2px solid rgba(10,10,11,.14)",
                      paddingLeft: 10,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: "#0a0a0b",
                      }}
                    >
                      {connection.sourceSystem}
                    </div>
                    <div
                      style={{
                        fontSize: 11.2,
                        color: "#888780",
                        lineHeight: 1.4,
                      }}
                    >
                      {connection.examples}
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: "#5f5e5a",
                        lineHeight: 1.45,
                      }}
                    >
                      {connection.extract}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(300px,100%),1fr))",
            gap: 10,
          }}
        >
          {sourceConnections.map((connection) => (
            <div
              key={connection.id}
              style={{
                border: "1px solid rgba(10,10,11,.1)",
                borderRadius: 8,
                padding: "12px 14px",
                background: "#fbfaf7",
              }}
            >
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 800,
                  color: "#0a0a0b",
                  marginBottom: 4,
                }}
              >
                {connection.sourceSystem}
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: "#5f5e5a",
                  lineHeight: 1.45,
                  marginBottom: 7,
                }}
              >
                {connection.extract}
              </div>
              <div
                style={{ fontSize: 11.5, color: "#2c2c2a", lineHeight: 1.45 }}
              >
                {connection.outcome}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
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
    const evidencePerf = vm.evidencePerformance;
    const performanceRows = d.performancePeriods ?? [];
    const monthlyUnclaimedCredits = performanceRows.reduce(
      (sum, row) =>
        sum +
        Math.max(
          0,
          Number(row.credit_calculated ?? 0) -
            Number(row.credit_claimed ?? 0),
        ),
      0,
    );
    const performancePeriodTable = performanceRows.length ? (
      <DataTable
        title="Monthly SLA history"
        note={`${performanceRows.length} contract-period rows · ${formatCurrency(monthlyUnclaimedCredits)} earned and unclaimed`}
        binding="source.contract_performance_observation"
        columns={[
          { label: "Period" },
          { label: "Metric" },
          { label: "Target", align: "right" },
          { label: "Actual", align: "right" },
          { label: "Status" },
          { label: "Credit owed", align: "right" },
          { label: "Claimed" },
        ]}
        rows={performanceRows.map((row) => {
          const creditOwed = Number(row.credit_calculated ?? 0);
          const claimed = Number(row.credit_claimed ?? 0);
          const hasCredit = creditOwed > 0;
          return {
            cells: [
              { text: formatMonth(row.period_start), mono: true },
              { text: row.metric_name, wrap: true },
              {
                text: row.contracted_target ?? "Not established",
                align: "right" as const,
              },
              {
                text:
                  row.actual_value ??
                  (row.value_num == null ? "Not established" : String(row.value_num)),
                align: "right" as const,
                weight: row.performance_state === "breached" ? 800 : 400,
                color: row.performance_state === "breached" ? "#a32d2d" : "#2c2c2a",
              },
              {
                text:
                  row.performance_state === "breached"
                    ? "Missed"
                    : row.performance_state === "not_loaded"
                      ? "Not loaded"
                      : "Met",
                weight: row.performance_state === "breached" ? 800 : 500,
                color: row.performance_state === "breached" ? "#a32d2d" : "#246b45",
              },
              {
                text: hasCredit ? formatCurrency(creditOwed) : "-",
                align: "right" as const,
                weight: hasCredit ? 800 : 400,
                color: hasCredit ? "#1d9e75" : "#888780",
              },
              {
                text: hasCredit ? (claimed > 0 ? "Yes" : "No") : "-",
                weight: hasCredit && claimed === 0 ? 800 : 400,
                color: hasCredit && claimed === 0 ? "#a32d2d" : "#5f5e5a",
              },
            ],
          };
        })}
        footnote="Credits shown here are owed/claim-state evidence only. They are not finance-confirmed outcomes until the remedy and finance gates close."
      />
    ) : null;
    if (!evidencePerf && performancePeriodTable) {
      return (
        <>
          <div
            style={{
              background: "#fff",
              border: "1px solid rgba(10,10,11,.12)",
              borderRadius: 8,
              padding: "16px 20px",
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 850,
                color: "#0a0a0b",
                lineHeight: 1.35,
                marginBottom: 6,
              }}
            >
              Monthly SLA performance is reviewable for this contract.
            </div>
            <div
              style={{
                fontSize: 12.8,
                color: "#5f5e5a",
                lineHeight: 1.5,
                maxWidth: "96ch",
              }}
            >
              Period-level performance rows are present even though no legacy
              aggregate summary was returned. The table below separates met
              months, missed months, earned credits, and claim state.
            </div>
          </div>
          {performancePeriodTable}
        </>
      );
    }
    if (evidencePerf) {
      const creditGap = Math.max(
        0,
        Number(evidencePerf.service_credits_earned_usd ?? 0) -
          Number(evidencePerf.service_credits_claimed_usd ?? 0),
      );
      const sevTotal =
        Number(evidencePerf.sev1_incidents ?? 0) +
        Number(evidencePerf.sev2_incidents ?? 0);
      const period =
        evidencePerf.period_start && evidencePerf.period_end
          ? `${evidencePerf.period_start} to ${evidencePerf.period_end}`
          : `${evidencePerf.sla_months} monthly SLA rows`;
      const sourceList = evidencePerf.source_systems.length
        ? evidencePerf.source_systems.join(" · ")
        : "contract evidence package";
      const row = (
        label: string,
        value: string,
        note?: string,
        tone = "#0a0a0b",
      ) => (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) auto",
            gap: 12,
            alignItems: "baseline",
            padding: "8px 0",
            borderBottom: "1px solid rgba(10,10,11,.07)",
          }}
        >
          <span style={{ minWidth: 0 }}>
            <span
              style={{
                display: "block",
                fontSize: 12.2,
                fontWeight: 750,
                color: "#0a0a0b",
              }}
            >
              {label}
            </span>
            {note ? (
              <span
                style={{
                  display: "block",
                  fontSize: 11.4,
                  color: "#5f5e5a",
                  lineHeight: 1.35,
                  marginTop: 2,
                }}
              >
                {note}
              </span>
            ) : null}
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12.2,
              fontWeight: 850,
              color: tone,
              textAlign: "right",
              whiteSpace: "nowrap",
            }}
          >
            {value}
          </span>
        </div>
      );
      const valueCard = (
        label: string,
        value: string,
        note: string,
        tone = "#0a0a0b",
      ) => (
        <div
          style={{
            background: "#fff",
            border: "1px solid rgba(10,10,11,.12)",
            borderRadius: 8,
            padding: "14px 16px",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: "#5f5e5a",
              marginBottom: 6,
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: 20,
              lineHeight: 1.1,
              fontWeight: 900,
              color: tone,
              marginBottom: 7,
            }}
          >
            {value}
          </div>
          <div style={{ fontSize: 12, color: "#5f5e5a", lineHeight: 1.4 }}>
            {note}
          </div>
        </div>
      );
      return (
        <>
          <div
            style={{
              background: "#fff",
              border: "1px solid rgba(10,10,11,.12)",
              borderRadius: 8,
              padding: "16px 20px",
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 850,
                color: "#0a0a0b",
                lineHeight: 1.35,
                marginBottom: 6,
              }}
            >
              Promise vs delivery is reviewable for this contract.
            </div>
            <div
              style={{
                fontSize: 12.8,
                color: "#5f5e5a",
                lineHeight: 1.5,
                maxWidth: "96ch",
              }}
            >
              {period}. Sources: {sourceList}. This tab answers whether the
              vendor delivered against measurable service and commercial
              evidence; it does not turn incident volume, variance, or
              opportunity into a finance-confirmed outcome without finance
              confirmation.
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
              gap: 12,
            }}
          >
            <div
              style={{
                background: "#fff",
                border: "1px solid rgba(10,10,11,.12)",
                borderRadius: 8,
                padding: "15px 17px",
              }}
            >
              <div
                style={{
                  fontSize: 13.2,
                  fontWeight: 850,
                  color: "#0a0a0b",
                  marginBottom: 8,
                }}
              >
                Vendor promise
              </div>
              {row(
                "Service period reviewed",
                period,
                "Monthly SLA and incident evidence loaded at contract grain.",
              )}
              {row(
                "Credit mechanism",
                "Loaded",
                "Earned, claimed, and received credits are separated so missed recovery is visible.",
              )}
              {row(
                "Potential recovery",
                formatCurrency(evidencePerf.recoverable_leakage_usd),
                "Potential recovery is derived from governed SLA, invoice, and rate-card rows.",
              )}
            </div>
            <div
              style={{
                background: "#fff",
                border: "1px solid rgba(10,10,11,.12)",
                borderRadius: 8,
                padding: "15px 17px",
              }}
            >
              <div
                style={{
                  fontSize: 13.2,
                  fontWeight: 850,
                  color: "#0a0a0b",
                  marginBottom: 8,
                }}
              >
                What actually happened
              </div>
              {row(
                "Sev1/Sev2 incidents",
                sevTotal.toLocaleString("en-US"),
                "Operating pressure; not savings by itself.",
              )}
              {row(
                "SLA credits earned / claimed / received",
                `${formatCurrency(evidencePerf.service_credits_earned_usd)} / ${formatCurrency(evidencePerf.service_credits_claimed_usd)} / ${formatCurrency(evidencePerf.service_credits_received_usd)}`,
              )}
              {row(
                "Credit gap to review",
                formatCurrency(creditGap),
                "Earned less claimed; still needs remedy and claim-window review.",
                "#1d9e75",
              )}
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
              gap: 12,
            }}
          >
            {valueCard(
              "Recover money",
              formatCurrency(evidencePerf.recoverable_leakage_usd),
              `${formatCurrency(creditGap)} SLA credit gap, ${formatCurrency(evidencePerf.invoice_exception_amount_usd)} invoice billing-rate exceptions, ${formatCurrency(evidencePerf.rate_card_variance_usd)} VMS / labor rate-card variance.`,
              "#1d9e75",
            )}
            {valueCard(
              "Avoid future spend",
              formatCurrency(evidencePerf.avoided_cost_usd),
              "Future commitment not incurred because scope, shelfware, renewal uplift, or consumption is reduced before signature.",
              "#1d9e75",
            )}
            {valueCard(
              "Improve the deal",
              formatCurrency(evidencePerf.negotiated_improvement_usd),
              "Commercial gain from price, term, index cap, volume tier, benchmark, or termination leverage after approval.",
              "#1d9e75",
            )}
            {valueCard(
              "Finance confirmed outcome",
              formatCurrency(evidencePerf.realized_value_usd),
              "Outcome only after finance confirmation; it is not the same as potential value.",
              "#246b45",
            )}
          </div>
          {performancePeriodTable}
        </>
      );
    }
    const perf = d.operationalPerformance;
    const fin = d.financialExposure;
    const incidents = perf?.cloud_sev1_sev2_incidents ?? null;
    const creditsEarned = perf?.service_credits_earned ?? null;
    const creditsClaimed = perf?.service_credits_claimed ?? null;
    const hasCreditEvidence = creditsEarned != null || creditsClaimed != null;
    const variance =
      fin?.linked_forecast_amount != null && fin.linked_actual_amount != null
        ? fin.linked_forecast_amount - fin.linked_actual_amount
        : null;
    const serviceCreditGap =
      creditsEarned != null && creditsClaimed != null
        ? Math.max(0, creditsEarned - creditsClaimed)
        : null;
    const performanceRead =
      incidents != null && incidents > 0
        ? hasCreditEvidence
          ? serviceCreditGap != null && serviceCreditGap > 0
            ? "Service issues have a quantified credit gap to review."
            : "Service issues are visible, but the loaded credit fields do not show a recoverable amount."
          : "Service issues are visible, but SLA-credit recovery is not yet provable from the loaded evidence."
        : "No service-performance issue is established from the loaded evidence.";
    const financialRead = fin
      ? "This tab shows the size of the operating/spend signal. It does not explain the cause until usage, entitlement, invoice, and finance evidence are tied back to the contract."
      : "No contract-level financial exposure rows were returned.";
    const knownRead = [
      fin
        ? `Spend baseline is available: ${formatCurrency(fin.linked_actual_amount)} actual against ${formatCurrency(fin.linked_forecast_amount)} forecast.`
        : null,
      incidents != null
        ? `Service pressure is available: ${incidents.toLocaleString("en-US")} Sev1/Sev2 incidents.`
        : null,
      hasCreditEvidence
        ? `SLA credit fields are available: earned ${formatCurrency(creditsEarned)}, claimed ${formatCurrency(creditsClaimed)}.`
        : null,
    ].filter(Boolean);
    const missingRead = [
      fin
        ? "usage and entitlement evidence to classify spend variance"
        : "contract-level financial exposure rows",
      hasCreditEvidence ? null : "monthly SLA credit history",
      "invoice/rate-card evidence before recovery can be claimed",
      "Finance/Tower attestation before any confirmed outcome claim",
    ].filter(Boolean);
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
      <>
        <div
          style={{
            background: "#fff",
            border: "1px solid rgba(10,10,11,.12)",
            borderRadius: 8,
            padding: "16px 20px",
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "#0a0a0b",
              lineHeight: 1.35,
              marginBottom: 6,
            }}
          >
            {performanceRead}
          </div>
          <div
            style={{
              fontSize: 12.8,
              color: "#5f5e5a",
              lineHeight: 1.5,
              maxWidth: "90ch",
            }}
          >
            {financialRead} Treat this as a diagnostic read, not a savings
            claim.
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
            gap: 14,
          }}
        >
          <div
            style={{
              background: "#fff",
              border: "1px solid rgba(10,10,11,.12)",
              borderRadius: 8,
              padding: "16px 18px",
            }}
          >
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 800,
                color: "#0a0a0b",
                marginBottom: 9,
              }}
            >
              What we know
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                color: "#2c2c2a",
                fontSize: 12.6,
                lineHeight: 1.55,
              }}
            >
              {(knownRead.length
                ? knownRead
                : [
                    "No performance or financial signal is established for this contract.",
                  ]
              ).map((item) => (
                <li key={String(item)}>{item}</li>
              ))}
            </ul>
          </div>
          <div
            style={{
              background: "#fff",
              border: "1px solid rgba(10,10,11,.12)",
              borderRadius: 8,
              padding: "16px 18px",
            }}
          >
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 800,
                color: "#0a0a0b",
                marginBottom: 9,
              }}
            >
              What we cannot conclude yet
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                color: "#5f5e5a",
                fontSize: 12.6,
                lineHeight: 1.55,
              }}
            >
              <li>Actual below forecast is not automatically savings.</li>
              <li>Incident count is not automatically a credit claim.</li>
              <li>
                Opportunity evidence is not a finance-confirmed outcome until
                Finance/Tower confirms it.
              </li>
            </ul>
          </div>
          <div
            style={{
              background: "#fff",
              border: "1px solid rgba(10,10,11,.12)",
              borderRadius: 8,
              padding: "16px 18px",
            }}
          >
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 800,
                color: "#0a0a0b",
                marginBottom: 9,
              }}
            >
              Evidence needed next
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                color: "#5f5e5a",
                fontSize: 12.6,
                lineHeight: 1.55,
              }}
            >
              {missingRead.map((item) => (
                <li key={String(item)}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
            gap: 14,
          }}
        >
          {fin ? (
            <div
              style={{
                background: "#fff",
                border: "1px solid rgba(10,10,11,.12)",
                borderRadius: 8,
                padding: "18px 20px",
              }}
            >
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 800,
                  color: "#0a0a0b",
                  marginBottom: 10,
                }}
              >
                Spend position
              </div>
              {(
                [
                  ["Budget", fin.linked_budget_amount],
                  ["Forecast", fin.linked_forecast_amount],
                  ["Actual", fin.linked_actual_amount],
                  ["Committed", fin.linked_committed_amount],
                ] as [string, number | null][]
              ).map(([label, v]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "baseline",
                    padding: "7px 0",
                    borderBottom: "1px solid rgba(10,10,11,.07)",
                  }}
                >
                  <span style={{ fontSize: 12.6, color: "#5f5e5a" }}>
                    {label}
                  </span>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12.6,
                      fontWeight: 700,
                      color: v == null ? "#b4b2a9" : "#0a0a0b",
                    }}
                  >
                    {formatCurrency(v)}
                  </span>
                </div>
              ))}
              <div
                style={{
                  fontSize: 12,
                  color: "#5f5e5a",
                  lineHeight: 1.45,
                  marginTop: 10,
                }}
              >
                {variance == null
                  ? "Variance cause is not established."
                  : `${formatCurrency(Math.abs(variance))} ${variance >= 0 ? "below forecast" : "above forecast"}; cause still needs usage and entitlement evidence.`}
              </div>
            </div>
          ) : null}
          {perf ? (
            <div
              style={{
                background: "#fff",
                border: "1px solid rgba(10,10,11,.12)",
                borderRadius: 8,
                padding: "18px 20px",
              }}
            >
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 800,
                  color: "#0a0a0b",
                  marginBottom: 10,
                }}
              >
                Service signal
              </div>
              <div
                style={{
                  fontSize: 12.8,
                  color: "#2c2c2a",
                  lineHeight: 1.5,
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
                    gap: 12,
                    alignItems: "baseline",
                    padding: "7px 0",
                    borderBottom: "1px solid rgba(10,10,11,.07)",
                  }}
                >
                  <span style={{ fontSize: 12.6, color: "#5f5e5a" }}>
                    {label}
                  </span>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12.6,
                      fontWeight: 700,
                      color: v == null ? "#b4b2a9" : "#0a0a0b",
                    }}
                  >
                    {v == null ? "Not established" : v.toLocaleString("en-US")}
                  </span>
                </div>
              ))}
              {perf.evidence_gap ? (
                <div
                  style={{
                    fontSize: 12.2,
                    color: "#6d420c",
                    lineHeight: 1.45,
                    marginTop: 10,
                    padding: "9px 11px",
                    border: "1px solid rgba(186,117,23,.25)",
                    borderRadius: 6,
                    background: "#fff8ec",
                  }}
                >
                  <b style={{ color: "#2c2c2a" }}>Need:</b>{" "}
                  {String(perf.evidence_gap)}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        {performancePeriodTable}
      </>
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
      <div
        style={{
          padding: "12px 24px",
          borderBottom: "1px solid rgba(10,10,11,.08)",
          background: "#fbfaf7",
          fontSize: 12.5,
          lineHeight: 1.55,
          color: "#5f5e5a",
        }}
      >
        Overview and Renewal use governed register facts from{" "}
        <b style={{ color: "#2c2c2a" }}>source.contract_360</b>. The rows below
        are document-extraction facts from{" "}
        <b style={{ color: "#2c2c2a" }}>doc.extraction</b>; &quot;No document
        value extracted&quot; means the extractor did not find that concept in
        the current file, not that the register fact is missing.
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
                    : "No document value extracted")}
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
