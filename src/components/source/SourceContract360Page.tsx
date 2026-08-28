"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Contract 360 — drill-down from Vendor & Contract Portfolio. Section 2 detail
// view of the recommended 8-section Source workspace restructure.
//
// Renders exactly what buildContract360View computed: commercial terms,
// confidence-tiered application scope (never blended into one number),
// financial exposure, operational performance, initiative dependencies, and
// a Tower performance/value overlay. Tower's own quality_state/evidence_state/
// claim_state labels are shown verbatim — this page narrates them, it never
// recomputes or upgrades what Tower already decided about its own data.
// ─────────────────────────────────────────────────────────────────────────────

import React, { type CSSProperties } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { SourceSubNav } from "@/components/source/SourceSubNav";
import { ANALYTICS } from "@/components/source/canvas/analytics/analytics-tokens";
import {
  formatPct,
  formatUsdCompact,
} from "@/lib/source/data-model/vendor-portfolio-view";
import { numberFromDb } from "@/lib/source/data-model/vendor-contract-portfolio";
import {
  RELATIONSHIP_METHOD_LABEL,
  type Contract360View,
} from "@/lib/source/data-model/contract-360-view";
import { isReviewableContractScope } from "@/lib/source/contract-optimization-intake";

interface SourceContract360PageProps {
  view: Contract360View;
  tenantName: string;
}

export function SourceContract360Page({
  view,
  tenantName,
}: SourceContract360PageProps) {
  const { contract } = view;
  return (
    <AppShell
      surface="source"
      agentName="Ava"
      surfaceContext={{
        sourceContract360Mode: true,
        contractId: contract.contract_id,
      }}
      topBarProps={{
        tenantName,
        showLocked: true,
        context: "Source · Contract 360",
      }}
      subNav={<SourceSubNav />}
    >
      <main data-testid="source-contract-360" style={MAIN_STYLE}>
        <div style={CONTAINER_STYLE}>
          <Link href="/source/workspace" style={BACK_LINK_STYLE}>
            &larr; Back to Source workspace
          </Link>
          <Header contract={contract} />
          <CommercialTermsPanel contract={contract} />
          <div style={TWO_COL_STYLE}>
            <ApplicationScopePanel tiers={view.scopeTiers} />
            <div style={{ display: "grid", gap: 20 }}>
              <FinancialExposurePanel row={view.financialExposure} />
              <OperationalPerformancePanel row={view.operationalPerformance} />
            </div>
          </div>
          <InitiativeDependencyPanel rows={view.initiativeDependencies} />
          <TowerOverlayPanel view={view} />
          <EvidenceLineagePanel rows={view.docExtractions} />
        </div>
      </main>
    </AppShell>
  );
}

function Header({ contract }: { contract: Contract360View["contract"] }) {
  const optimizeHref = `/source/optimize?contractId=${encodeURIComponent(
    contract.contract_id,
  )}`;
  return (
    <header style={HEADER_STYLE}>
      <div style={{ minWidth: 0, display: "grid", gap: 6 }}>
        <div style={EYEBROW_STYLE}>Source · Contract 360</div>
        <h1 style={H1_STYLE}>{contract.contract_name}</h1>
        <p style={SUBLINE_STYLE}>
          {contract.vendor_name}
          {contract.vendor_category ? ` · ${contract.vendor_category}` : ""}
        </p>
        {isReviewableContractScope(contract.scope_summary) ? (
          <p style={SUBLINE_STYLE}>{contract.scope_summary}</p>
        ) : null}
      </div>
      <Link
        href={optimizeHref}
        style={PRIMARY_ACTION_STYLE}
        data-testid="contract-360-optimize"
      >
        Optimize this contract
      </Link>
    </header>
  );
}

function ConflictNote({
  flag,
  resolvedValue,
  label,
}: {
  flag: boolean | null;
  resolvedValue: number | null;
  label: string;
}) {
  if (!flag) return null;
  const resolved = numberFromDb(resolvedValue);
  return (
    <div style={{ ...SUBLINE_STYLE, color: ANALYTICS.RUST, margin: 0 }}>
      {label} conflict flagged across sources — resolved value used:{" "}
      {resolved != null ? formatUsdCompact(resolved) : "not resolved"}.
    </div>
  );
}

function CommercialTermsPanel({
  contract: c,
}: {
  contract: Contract360View["contract"];
}) {
  const facts: Array<[string, string]> = [
    ["Annual value", formatUsdCompact(numberFromDb(c.annual_value) ?? 0)],
    [
      "Total committed value",
      formatUsdCompact(numberFromDb(c.total_committed_value) ?? 0),
    ],
    [
      "Committed annual spend",
      formatUsdCompact(numberFromDb(c.committed_annual_spend) ?? 0),
    ],
    [
      "Actual annual spend",
      formatUsdCompact(numberFromDb(c.actual_annual_spend) ?? 0),
    ],
    [
      "End date",
      c.end_date
        ? new Date(c.end_date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "—",
    ],
    [
      "Notice period",
      c.notice_period_days != null ? `${c.notice_period_days} days` : "—",
    ],
    ["Auto-renew", c.auto_renew ? "Yes" : "No"],
    ["Renewal decision state", c.renewal_decision_state ?? "—"],
    ["Benchmarking clause", c.benchmarking_clause ?? "—"],
    ["Exit rights", c.exit_rights_summary ?? "—"],
    ["Alternatives available", c.alternatives_available ?? "—"],
    [
      "Scoped applications",
      c.scoped_application_count != null
        ? String(c.scoped_application_count)
        : "—",
    ],
    [
      "Critical applications",
      c.critical_application_count != null
        ? String(c.critical_application_count)
        : "—",
    ],
    [
      "Initiative dependencies",
      c.initiative_dependency_count != null
        ? String(c.initiative_dependency_count)
        : "—",
    ],
  ];
  return (
    <section style={PANEL_STYLE} aria-label="Commercial terms">
      <div style={SECTION_HEAD_STYLE}>Commercial terms</div>
      <ConflictNote
        flag={c.annual_value_conflict_flag}
        resolvedValue={c.resolved_annual_value}
        label="Annual value"
      />
      <ConflictNote
        flag={c.total_committed_value_conflict_flag}
        resolvedValue={c.resolved_total_committed_value}
        label="Total committed value"
      />
      {c.concentration_note ? (
        <div style={{ ...SUBLINE_STYLE, margin: 0 }}>
          Concentration note: {c.concentration_note}
        </div>
      ) : null}
      <dl style={FACT_GRID_STYLE}>
        {facts.map(([label, value]) => (
          <div key={label} style={FACT_ITEM_STYLE}>
            <dt style={FACT_LABEL_STYLE}>{label}</dt>
            <dd style={FACT_VALUE_STYLE}>{value}</dd>
          </div>
        ))}
      </dl>
      {numberFromDb(c.source_confidence) != null ? (
        <div style={{ ...SUBLINE_STYLE, margin: 0, color: ANALYTICS.MUTED }}>
          Extraction confidence: {formatPct(numberFromDb(c.source_confidence)!)}
        </div>
      ) : null}
    </section>
  );
}

function ApplicationScopePanel({
  tiers,
}: {
  tiers: Contract360View["scopeTiers"];
}) {
  const groups: Array<[string, typeof tiers.explicit]> = [
    ["Explicit", tiers.explicit],
    ["Vendor-inferred", tiers.vendorInferred],
    ["Unresolved", tiers.unresolved],
  ];
  return (
    <section style={PANEL_STYLE} aria-label="Application scope">
      <div style={SECTION_HEAD_STYLE}>
        Application scope ({tiers.totalCount})
      </div>
      <p style={{ ...SUBLINE_STYLE, margin: 0 }}>
        {tiers.explicit.length} explicit · {tiers.vendorInferred.length}{" "}
        vendor-inferred · {tiers.unresolved.length} unresolved. Only explicit
        links are proven contract scope — the rest are vendor-based
        associations, not confirmed contractual coverage.
      </p>
      {groups.map(([label, rows]) =>
        rows.length === 0 ? null : (
          <div key={label} style={{ display: "grid", gap: 6 }}>
            <div style={SUBSECTION_LABEL_STYLE}>
              {label} ({rows.length})
            </div>
            <table style={TABLE_STYLE}>
              <thead>
                <tr>
                  <th style={TH_STYLE}>Application</th>
                  <th style={TH_STYLE}>Criticality</th>
                  <th style={TH_STYLE}>Method</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 12).map((row) => (
                  <tr key={`${row.contract_id}::${row.application_ref}`}>
                    <td style={TD_STYLE}>{row.application_name}</td>
                    <td style={TD_STYLE}>{row.criticality ?? "—"}</td>
                    <td style={{ ...TD_STYLE, color: ANALYTICS.MUTED }}>
                      {
                        RELATIONSHIP_METHOD_LABEL[
                          label === "Explicit"
                            ? "explicit_contract_scope"
                            : label === "Vendor-inferred"
                              ? "vendor_based_inference"
                              : "unresolved"
                        ]
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 12 ? (
              <div
                style={{ ...SUBLINE_STYLE, margin: 0, color: ANALYTICS.MUTED }}
              >
                +{rows.length - 12} more
              </div>
            ) : null}
          </div>
        ),
      )}
    </section>
  );
}

function FinancialExposurePanel({
  row,
}: {
  row: Contract360View["financialExposure"];
}) {
  return (
    <section style={PANEL_STYLE} aria-label="Financial exposure">
      <div style={SECTION_HEAD_STYLE}>Financial exposure</div>
      {!row ? (
        <p style={{ ...SUBLINE_STYLE, margin: 0, color: ANALYTICS.MUTED }}>
          No source.contract_financial_exposure row for this contract.
        </p>
      ) : (
        <dl style={FACT_GRID_STYLE}>
          <FactRow
            label="Linked budget"
            value={(() => {
              const n = numberFromDb(row.linked_budget_amount);
              return n != null ? formatUsdCompact(n) : "—";
            })()}
          />
          <FactRow
            label="Linked forecast"
            value={(() => {
              const n = numberFromDb(row.linked_forecast_amount);
              return n != null ? formatUsdCompact(n) : "—";
            })()}
          />
          <FactRow
            label="Linked actual"
            value={(() => {
              const n = numberFromDb(row.linked_actual_amount);
              return n != null ? formatUsdCompact(n) : "—";
            })()}
          />
          <FactRow
            label="Linked committed"
            value={(() => {
              const n = numberFromDb(row.linked_committed_amount);
              return n != null ? formatUsdCompact(n) : "—";
            })()}
          />
          <FactRow
            label="Linked budget lines"
            value={
              row.linked_budget_lines != null
                ? String(row.linked_budget_lines)
                : "—"
            }
          />
        </dl>
      )}
    </section>
  );
}

function OperationalPerformancePanel({
  row,
}: {
  row: Contract360View["operationalPerformance"];
}) {
  return (
    <section style={PANEL_STYLE} aria-label="Operational performance">
      <div style={SECTION_HEAD_STYLE}>Operational performance</div>
      {!row ? (
        <p style={{ ...SUBLINE_STYLE, margin: 0, color: ANALYTICS.MUTED }}>
          No source.contract_operational_performance row for this contract.
        </p>
      ) : (
        <>
          {row.sla_summary ? (
            <p style={{ ...SUBLINE_STYLE, margin: 0 }}>{row.sla_summary}</p>
          ) : null}
          <dl style={FACT_GRID_STYLE}>
            <FactRow
              label="Sev1/Sev2 incidents"
              value={
                row.cloud_sev1_sev2_incidents != null
                  ? String(row.cloud_sev1_sev2_incidents)
                  : "—"
              }
            />
            <FactRow
              label="Change failure rate"
              value={(() => {
                const n = numberFromDb(row.avg_cloud_change_failure_rate);
                return n != null ? formatPct(n) : "—";
              })()}
            />
            <FactRow
              label="Service credits earned"
              value={(() => {
                const n = numberFromDb(row.service_credits_earned);
                return n != null ? formatUsdCompact(n) : "—";
              })()}
            />
            <FactRow
              label="Service credits claimed"
              value={(() => {
                const n = numberFromDb(row.service_credits_claimed);
                return n != null ? formatUsdCompact(n) : "—";
              })()}
            />
          </dl>
          {row.evidence_gap ? (
            <p style={{ ...SUBLINE_STYLE, margin: 0, color: ANALYTICS.RUST }}>
              Evidence gap flagged: {String(row.evidence_gap)}
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}

function InitiativeDependencyPanel({
  rows,
}: {
  rows: Contract360View["initiativeDependencies"];
}) {
  if (rows.length === 0) return null;
  return (
    <section style={PANEL_STYLE} aria-label="Initiative dependencies">
      <div style={SECTION_HEAD_STYLE}>
        Initiative dependencies ({rows.length})
      </div>
      <table style={TABLE_STYLE}>
        <thead>
          <tr>
            <th style={TH_STYLE}>Initiative</th>
            <th style={TH_STYLE}>Status</th>
            <th style={TH_STYLE}>Target end</th>
            <th style={{ ...TH_STYLE, textAlign: "right" }}>Approved budget</th>
            <th style={TH_STYLE}>Decision needed</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.initiative_ref}>
              <td style={TD_STYLE}>{r.initiative_project_name}</td>
              <td style={TD_STYLE}>{r.status ?? "—"}</td>
              <td style={{ ...TD_STYLE, color: ANALYTICS.MUTED }}>
                {r.target_end_date
                  ? new Date(r.target_end_date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                    })
                  : "—"}
              </td>
              <td
                style={{
                  ...TD_STYLE,
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {(() => {
                  const n = numberFromDb(r.approved_budget);
                  return n != null ? formatUsdCompact(n) : "—";
                })()}
              </td>
              <td style={{ ...TD_STYLE, color: ANALYTICS.RUST }}>
                {r.decision_needed ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function TowerOverlayPanel({ view }: { view: Contract360View }) {
  return (
    <section
      style={PANEL_STYLE}
      aria-label="Tower performance and value overlay"
    >
      <div style={SECTION_HEAD_STYLE}>
        Tower performance &amp; value overlay
      </div>
      <p style={{ ...SUBLINE_STYLE, margin: 0 }}>
        Independently measured by Tower against this contract&rsquo;s vendor and
        scoped applications — Source narrates these, it never computes them.
      </p>
      {!view.hasTowerOverlay ? (
        <p style={{ ...SUBLINE_STYLE, margin: 0, color: ANALYTICS.MUTED }}>
          No tower.metric_observation or tower.value_claim rows overlay this
          contract yet.
        </p>
      ) : (
        <>
          {view.towerObservations.length > 0 ? (
            <table style={TABLE_STYLE}>
              <thead>
                <tr>
                  <th style={TH_STYLE}>Metric</th>
                  <th style={TH_STYLE}>Subject</th>
                  <th style={{ ...TH_STYLE, textAlign: "right" }}>Value</th>
                  <th style={TH_STYLE}>Quality</th>
                  <th style={TH_STYLE}>Evidence</th>
                </tr>
              </thead>
              <tbody>
                {view.towerObservations.map((o) => (
                  <tr key={o.observation_id}>
                    <td style={TD_STYLE}>{o.metric_ref}</td>
                    <td style={{ ...TD_STYLE, color: ANALYTICS.MUTED }}>
                      {o.subject_ref}
                    </td>
                    <td
                      style={{
                        ...TD_STYLE,
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {o.value_num != null
                        ? `${o.value_num}${o.unit ? ` ${o.unit}` : ""}`
                        : (o.value_text ?? "—")}
                    </td>
                    <td style={TD_STYLE}>{o.quality_state}</td>
                    <td style={TD_STYLE}>{o.evidence_state}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
          {view.towerValueClaims.length > 0 ? (
            <table style={TABLE_STYLE}>
              <thead>
                <tr>
                  <th style={TH_STYLE}>Outcome metric</th>
                  <th style={{ ...TH_STYLE, textAlign: "right" }}>Promised</th>
                  <th style={{ ...TH_STYLE, textAlign: "right" }}>
                    Calculated
                  </th>
                  <th style={TH_STYLE}>Claim state</th>
                </tr>
              </thead>
              <tbody>
                {view.towerValueClaims.map((claim) => (
                  <tr key={claim.claim_id}>
                    <td style={TD_STYLE}>{claim.outcome_metric_ref}</td>
                    <td
                      style={{
                        ...TD_STYLE,
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {(() => {
                        const n = numberFromDb(claim.promised_value);
                        return n != null ? formatUsdCompact(n) : "—";
                      })()}
                    </td>
                    <td
                      style={{
                        ...TD_STYLE,
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {(() => {
                        const n = numberFromDb(claim.calculated_value);
                        return n != null ? formatUsdCompact(n) : "—";
                      })()}
                    </td>
                    <td style={TD_STYLE}>
                      {claim.claim_state}
                      {claim.blocked_reason ? ` — ${claim.blocked_reason}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </>
      )}
    </section>
  );
}

function EvidenceLineagePanel({
  rows,
}: {
  rows: Contract360View["docExtractions"];
}) {
  return (
    <section style={PANEL_STYLE} aria-label="Evidence lineage">
      <div style={SECTION_HEAD_STYLE}>Evidence lineage ({rows.length})</div>
      <p style={{ ...SUBLINE_STYLE, margin: 0 }}>
        Exact clause/row provenance behind the commercial terms above — cites
        the source file, plus page and section when the source was a parsed
        document rather than a structured import.
      </p>
      {rows.length === 0 ? (
        <p style={{ ...SUBLINE_STYLE, margin: 0, color: ANALYTICS.MUTED }}>
          No doc.extraction rows cite this contract or vendor yet.
        </p>
      ) : (
        <table style={TABLE_STYLE}>
          <thead>
            <tr>
              <th style={TH_STYLE}>Concept</th>
              <th style={TH_STYLE}>Value</th>
              <th style={TH_STYLE}>Source</th>
              <th style={TH_STYLE}>Method</th>
              <th style={TH_STYLE}>Review state</th>
              <th style={{ ...TH_STYLE, textAlign: "right" }}>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.extraction_id}>
                <td style={TD_STYLE}>{r.concept_ref}</td>
                <td style={TD_STYLE}>
                  {r.value_text ??
                    (r.value_num != null ? String(r.value_num) : "—")}
                </td>
                <td style={{ ...TD_STYLE, color: ANALYTICS.MUTED }}>
                  {r.source_file_id ?? "—"}
                  {r.source_page != null ? `, p.${r.source_page}` : ""}
                  {r.source_section ? ` · ${r.source_section}` : ""}
                </td>
                <td style={{ ...TD_STYLE, color: ANALYTICS.MUTED }}>
                  {r.method ?? "—"}
                </td>
                <td style={TD_STYLE}>{r.review_state ?? "—"}</td>
                <td
                  style={{
                    ...TD_STYLE,
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {(() => {
                    const n = numberFromDb(r.confidence);
                    return n != null ? formatPct(n) : "—";
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={FACT_ITEM_STYLE}>
      <dt style={FACT_LABEL_STYLE}>{label}</dt>
      <dd style={FACT_VALUE_STYLE}>{value}</dd>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const MAIN_STYLE: CSSProperties = {
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  overflowY: "auto",
  overflowX: "hidden",
  background: ANALYTICS.PAGE_BG,
};

const CONTAINER_STYLE: CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
  padding: "28px 32px 64px",
  display: "grid",
  gap: 24,
};

const BACK_LINK_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.SANS,
  fontSize: 13,
  color: ANALYTICS.MUTED,
  textDecoration: "none",
  justifySelf: "start",
};

const HEADER_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 24,
  flexWrap: "wrap",
};

const EYEBROW_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.MONO,
  fontSize: 10,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: ANALYTICS.FAINT,
};

const H1_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.SERIF,
  fontSize: 30,
  fontWeight: 400,
  lineHeight: 1.1,
  letterSpacing: "-0.02em",
  color: ANALYTICS.INK,
  margin: 0,
};

const SUBLINE_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: ANALYTICS.SANS,
  fontSize: 14,
  lineHeight: 1.5,
  color: ANALYTICS.MUTED,
  maxWidth: 780,
};

const PRIMARY_ACTION_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 42,
  padding: "0 16px",
  borderRadius: 8,
  background: ANALYTICS.INK,
  border: `1px solid ${ANALYTICS.INK}`,
  color: "#fff",
  fontFamily: ANALYTICS.SANS,
  fontSize: 13,
  fontWeight: 800,
  textDecoration: "none",
  whiteSpace: "nowrap",
};

const TWO_COL_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 340px",
  gap: 24,
  alignItems: "start",
};

const PANEL_STYLE: CSSProperties = {
  display: "grid",
  gap: 12,
  padding: "18px 20px",
  border: `1px solid ${ANALYTICS.LINE}`,
  borderRadius: ANALYTICS.RADIUS,
  background: ANALYTICS.CARD,
  boxShadow: ANALYTICS.SHADOW_SM,
  minWidth: 0,
};

const SECTION_HEAD_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.SERIF,
  fontSize: 17,
  fontWeight: 500,
  color: ANALYTICS.INK,
};

const SUBSECTION_LABEL_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.MONO,
  fontSize: 10,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: ANALYTICS.FAINT,
  fontWeight: 700,
};

const FACT_GRID_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 10,
  margin: 0,
};

const FACT_ITEM_STYLE: CSSProperties = {
  display: "grid",
  gap: 2,
};

const FACT_LABEL_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.MONO,
  fontSize: 10,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: ANALYTICS.FAINT,
  margin: 0,
};

const FACT_VALUE_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.SANS,
  fontSize: 14,
  color: ANALYTICS.INK,
  margin: 0,
  fontVariantNumeric: "tabular-nums",
};

const TABLE_STYLE: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontFamily: ANALYTICS.SANS,
  fontSize: 13,
};

const TH_STYLE: CSSProperties = {
  textAlign: "left",
  padding: "6px 8px",
  fontSize: 11,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: ANALYTICS.FAINT,
  borderBottom: `1px solid ${ANALYTICS.LINE_STRONG}`,
};

const TD_STYLE: CSSProperties = {
  padding: "7px 8px",
  color: ANALYTICS.INK,
  borderBottom: `1px solid ${ANALYTICS.LINE}`,
};
