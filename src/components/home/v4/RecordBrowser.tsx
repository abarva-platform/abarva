"use client";

import { useMemo, useState, type CSSProperties } from "react";

import type { TechObjectType, TechRecordType } from "@/lib/home/preview/types";
import { MONO, PAGE_X, SANS, SERIF, V4, eyebrow } from "./tokens";

type RecordRow = Record<string, string | number | boolean | null | undefined>;

interface Column {
  key: string;
  label: string;
  width: number;
  priority?: "core" | "wide";
  align?: "right";
  kind?: "mono" | "pill" | "money" | "muted";
}

interface Metric {
  label: string;
  value: string;
  tone?: string;
}

const COLUMN_PRESETS: Record<TechObjectType, Column[]> = {
  application_system: [
    { key: "systemName", label: "System", width: 250, priority: "core" },
    { key: "businessFunction", label: "Function", width: 190 },
    { key: "systemCategory", label: "Category", width: 210, kind: "muted" },
    { key: "criticality", label: "Criticality", width: 104, kind: "mono" },
    { key: "lifecycleState", label: "Lifecycle", width: 138, kind: "pill" },
    { key: "vendor", label: "Vendor", width: 160, priority: "wide", kind: "muted" },
    { key: "interfacesCount", label: "Interfaces", width: 96, priority: "wide", align: "right", kind: "mono" },
    { key: "annualCostUsd", label: "Annual cost", width: 126, priority: "wide", align: "right", kind: "money" },
  ],
  vendor_contract: [
    { key: "vendorName", label: "Vendor", width: 230, priority: "core" },
    { key: "contractName", label: "Contract", width: 260 },
    { key: "serviceCategory", label: "Service", width: 220, kind: "muted" },
    { key: "annualSpendUsd", label: "Annual spend", width: 132, align: "right", kind: "money" },
    { key: "renewalDate", label: "Renewal", width: 112, kind: "mono" },
    { key: "riskRating", label: "Risk", width: 96, kind: "pill" },
    { key: "autoRenewFlag", label: "Auto-renew", width: 112, priority: "wide", kind: "mono" },
  ],
  infrastructure_platform: [
    { key: "platformName", label: "Platform", width: 250, priority: "core" },
    { key: "platformType", label: "Type", width: 190 },
    { key: "hostingModel", label: "Hosting", width: 142, kind: "mono" },
    { key: "criticality", label: "Criticality", width: 104, kind: "mono" },
    { key: "lifecycleState", label: "Lifecycle", width: 138, kind: "pill" },
    { key: "utilizationPct", label: "Util.", width: 78, priority: "wide", align: "right", kind: "mono" },
    { key: "capacityHeadroomPct", label: "Headroom", width: 96, priority: "wide", align: "right", kind: "mono" },
    { key: "annualCostUsd", label: "Annual cost", width: 126, priority: "wide", align: "right", kind: "money" },
  ],
  data_asset_or_integration: [
    { key: "dataAssetName", label: "Asset", width: 250, priority: "core" },
    { key: "dataDomain", label: "Domain", width: 170 },
    { key: "sourceSystem", label: "Source", width: 210 },
    { key: "targetSystem", label: "Target", width: 230 },
    { key: "integrationType", label: "Mechanism", width: 170, kind: "muted" },
    { key: "refreshFrequency", label: "Refresh", width: 106, priority: "wide", kind: "mono" },
    { key: "qualityStatus", label: "Quality", width: 154, priority: "wide", kind: "pill" },
    { key: "regulatedDataFlag", label: "Reg.", width: 72, priority: "wide", align: "right", kind: "mono" },
  ],
};

const FALLBACK_COLUMNS: Column[] = [
  { key: "name", label: "Name", width: 240, priority: "core" },
  { key: "type", label: "Type", width: 180 },
  { key: "owner", label: "Owner", width: 180 },
];

const DETAIL_FIELDS: Partial<Record<TechObjectType, string[]>> = {
  application_system: [
    "systemName",
    "systemCategory",
    "businessFunction",
    "businessOwner",
    "technologyOwner",
    "vendor",
    "deploymentModel",
    "hostingLocation",
    "dataDomains",
    "dataClassification",
    "complianceScope",
    "cloudReadiness",
    "replacementCandidate",
    "contractRef",
    "annualCostBasis",
    "originalRowId",
  ],
  vendor_contract: [
    "vendorName",
    "contractName",
    "serviceCategory",
    "businessOwner",
    "contractOwner",
    "annualSpendUsd",
    "commercialModel",
    "supportedSystems",
    "supportedFunctions",
    "riskRating",
    "autoRenewFlag",
    "noticePeriodDays",
    "exitCostUsd",
    "concentrationRisk",
    "benchmarkClause",
    "originalRowId",
  ],
  infrastructure_platform: [
    "platformName",
    "platformType",
    "hostingModel",
    "dataCenterOrRegion",
    "technologyStack",
    "operationalOwner",
    "criticality",
    "lifecycleState",
    "capacityOrScale",
    "constraints",
    "utilizationPct",
    "capacityHeadroomPct",
    "drTier",
    "endOfLifeDate",
    "originalRowId",
  ],
  data_asset_or_integration: [
    "dataAssetName",
    "dataDomain",
    "sourceSystem",
    "targetSystem",
    "integrationType",
    "platformOrDatabase",
    "refreshFrequency",
    "dataOwner",
    "dataSteward",
    "qualityStatus",
    "regulatedDataFlag",
    "analyticsUsage",
    "sourceSystemRefId",
    "targetSystemRefId",
    "originalRowId",
  ],
};

const PILL_TONE: Record<string, { bg: string; fg: string }> = {
  current: { bg: "#e1f5ee", fg: "#0f6e56" },
  low: { bg: "#e1f5ee", fg: "#0f6e56" },
  true: { bg: "#faeeda", fg: V4.amber },
  yes: { bg: "#faeeda", fg: V4.amber },
  medium: { bg: "#faeeda", fg: V4.amber },
  legacy_stable: { bg: V4.cream, fg: V4.slate },
  sunset_planned: { bg: "#faeeda", fg: V4.amber },
  developing_governance: { bg: "#faeeda", fg: V4.amber },
  ungoverned_needs_review: { bg: "#fceded", fg: V4.red },
  deprecated: { bg: "#fceded", fg: V4.red },
  high: { bg: "#fceded", fg: V4.red },
  tier1: { bg: "#e8f0fa", fg: V4.blue },
};

export function RecordBrowser({ recordType }: { recordType: TechRecordType }) {
  const [query, setQuery] = useState("");
  const [primaryFilter, setPrimaryFilter] = useState<string | null>(null);
  const [facetFilters, setFacetFilters] = useState<Record<string, string>>({});
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const rows = useMemo(() => (recordType.rows ?? []) as RecordRow[], [recordType.rows]);
  const indexedRows = useMemo(
    () => rows.map((row, index) => ({ row, index, key: rowKey(row, index) })),
    [rows],
  );
  const columns = useMemo(() => columnsFor(recordType), [recordType]);
  const primaryDimension = recordType.primaryDimension ?? undefined;

  const clusteredPrimary = useMemo(
    () => (recordType.dimensionCounts ?? []).filter((d) => d.count > 1).slice(0, 14),
    [recordType.dimensionCounts],
  );

  const facets = useMemo(() => buildFacets(rows, recordType.objectType, primaryDimension), [
    rows,
    recordType.objectType,
    primaryDimension,
  ]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return indexedRows.filter(({ row }) => {
      if (primaryFilter && primaryDimension && bucket(row[primaryDimension]) !== primaryFilter) return false;
      for (const [field, value] of Object.entries(facetFilters)) {
        if (bucket(row[field]) !== value) return false;
      }
      if (!q) return true;
      return (recordType.columns ?? Object.keys(row)).some((field) =>
        String(row[field] ?? "").toLowerCase().includes(q),
      );
    });
  }, [facetFilters, indexedRows, primaryDimension, primaryFilter, query, recordType.columns]);

  const shown = filtered.slice(0, 120);
  const selected = filtered.find((r) => r.key === selectedKey) ?? filtered[0] ?? indexedRows[0];
  const metrics = useMemo(() => buildMetrics(rows, recordType.objectType, primaryDimension), [
    rows,
    recordType.objectType,
    primaryDimension,
  ]);
  const fieldCount = recordType.columns?.length ?? Object.keys(rows[0] ?? {}).length;
  const activeFilterCount = Number(Boolean(primaryFilter)) + Object.keys(facetFilters).length + Number(Boolean(query.trim()));

  function toggleFacet(field: string, value: string) {
    setFacetFilters((current) => {
      const next = { ...current };
      if (next[field] === value) delete next[field];
      else next[field] = value;
      return next;
    });
  }

  function clearFilters() {
    setQuery("");
    setPrimaryFilter(null);
    setFacetFilters({});
  }

  return (
    <div style={{ padding: `46px ${PAGE_X}px 66px` }}>
      <style>{`
        @media (max-width: 1260px) {
          [data-record-layout] { grid-template-columns: 1fr !important; }
          [data-detail-pane] { position: static !important; }
          table[data-records] [data-priority="wide"] { display: none; }
        }
        @media (max-width: 760px) {
          [data-record-metrics] { grid-template-columns: 1fr !important; }
          [data-record-controls] { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <header style={{ maxWidth: 1120 }}>
        <span style={eyebrow(V4.blue)}>Record browser · {recordType.label}</span>
        <h1 style={titleStyle}>
          {headlineFor(recordType.objectType, rows.length)}
        </h1>
        <div style={metaLineStyle}>
          <span>{rows.length.toLocaleString()} records</span>
          <span>{fieldCount.toLocaleString()} source fields</span>
          {primaryDimension ? <span>clustered by {labelFor(primaryDimension)}</span> : null}
        </div>
      </header>

      <section data-record-metrics style={metricGridStyle}>
        {metrics.map((metric) => (
          <div key={metric.label} style={metricStyle}>
            <span style={{ ...metricValueStyle, color: metric.tone ?? V4.ink }}>{metric.value}</span>
            <span style={metricLabelStyle}>{metric.label}</span>
          </div>
        ))}
      </section>

      <div data-record-controls style={controlsStyle}>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${recordType.label.toLowerCase()}`}
          aria-label={`Search ${recordType.label}`}
          style={searchStyle}
        />
        <div style={countStyle}>
          <strong>{filtered.length.toLocaleString()}</strong>
          <span>of {rows.length.toLocaleString()} shown</span>
          {activeFilterCount > 0 ? (
            <button type="button" onClick={clearFilters} style={clearButtonStyle}>
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {primaryDimension && clusteredPrimary.length > 0 ? (
        <section style={primaryBandStyle}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginBottom: 12 }}>
            <span style={eyebrow(V4.slate)}>{labelFor(primaryDimension)}</span>
            <span style={{ fontFamily: MONO, fontSize: 11, color: V4.slate }}>
              {(recordType.dimensionCounts?.length ?? 0).toLocaleString()} values
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <FilterChip label="All" count={rows.length} active={!primaryFilter} onClick={() => setPrimaryFilter(null)} />
            {clusteredPrimary.map((item) => (
              <FilterChip
                key={item.value}
                label={item.value}
                count={item.count}
                active={primaryFilter === item.value}
                onClick={() => setPrimaryFilter(primaryFilter === item.value ? null : item.value)}
              />
            ))}
          </div>
        </section>
      ) : null}

      <div data-record-layout style={layoutStyle}>
        <section style={{ minWidth: 0 }}>
          <div style={tableShellStyle}>
            <table data-records style={tableStyle}>
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      data-priority={column.priority}
                      style={{
                        ...headerCellStyle,
                        width: column.width,
                        textAlign: column.align ?? "left",
                      }}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map(({ row, key }) => (
                  <tr
                    key={key}
                    onClick={() => setSelectedKey(key)}
                    style={{
                      background: selected?.key === key ? "rgba(0,102,204,0.055)" : V4.surface,
                      cursor: "pointer",
                    }}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        data-priority={column.priority}
                        style={{
                          ...bodyCellStyle,
                          textAlign: column.align ?? "left",
                          fontFamily: column.kind === "mono" || column.kind === "money" ? MONO : SANS,
                          color: column.kind === "muted" ? V4.slate : V4.inkSoft,
                          fontVariantNumeric: column.align === "right" || column.kind === "money" ? "tabular-nums" : undefined,
                        }}
                      >
                        <CellValue value={row[column.key]} column={column} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {shown.length === 0 ? (
              <p style={emptyStyle}>No records match the current filters.</p>
            ) : null}
          </div>
          <p style={footnoteStyle}>
            Showing {shown.length.toLocaleString()} of {filtered.length.toLocaleString()} matched records
            {filtered.length > shown.length ? " · first page only" : ""}.
          </p>
        </section>

        <aside data-detail-pane style={detailPaneStyle}>
          <div style={{ display: "grid", gap: 22 }}>
            {facets.map((facet) => (
              <Facet
                key={facet.field}
                title={facet.title}
                field={facet.field}
                counts={facet.counts}
                activeValue={facetFilters[facet.field] ?? null}
                onToggle={toggleFacet}
              />
            ))}
          </div>

          {selected ? (
            <SelectedRecord
              recordType={recordType.objectType}
              row={selected.row}
              ordinal={selected.index + 1}
              fieldCount={fieldCount}
            />
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function columnsFor(recordType: TechRecordType): Column[] {
  const available = new Set(recordType.columns ?? Object.keys(recordType.rows?.[0] ?? {}));
  const preset = COLUMN_PRESETS[recordType.objectType] ?? FALLBACK_COLUMNS;
  const columns = preset.filter((column) => available.has(column.key));
  if (columns.length) return columns;
  return [...available].slice(0, 8).map((field, index) => ({
    key: field,
    label: labelFor(field),
    width: index === 0 ? 240 : 160,
    priority: index === 0 ? "core" : undefined,
  }));
}

function buildMetrics(rows: RecordRow[], objectType: TechObjectType, primaryDimension?: string): Metric[] {
  const lifecycleWatch = rows.filter((row) =>
    ["legacy_stable", "sunset_planned", "deprecated"].includes(String(row.lifecycleState ?? "")),
  ).length;
  const regulated = rows.filter((row) =>
    ["true", "yes", "phi", "hipaa"].some((needle) =>
      `${row.regulatedDataFlag ?? ""} ${row.dataClassification ?? ""} ${row.complianceScope ?? ""}`.toLowerCase().includes(needle),
    ),
  ).length;
  const replacement = rows.filter((row) => String(row.replacementCandidate ?? "").toLowerCase() === "yes").length;
  const tier1 = rows.filter((row) => String(row.criticality ?? "").toLowerCase() === "tier1").length;
  const spendField = rows.some((row) => row.annualSpendUsd !== undefined) ? "annualSpendUsd" : "annualCostUsd";
  const spend = rows.reduce((sum, row) => sum + numeric(row[spendField]), 0);
  const dimensions = primaryDimension ? new Set(rows.map((row) => bucket(row[primaryDimension])).filter((v) => v !== "(not specified)")).size : 0;

  if (objectType === "vendor_contract") {
    const autoRenew = rows.filter((row) => isTruthy(row.autoRenewFlag)).length;
    const highRisk = rows.filter((row) => String(row.riskRating ?? "").toLowerCase() === "high").length;
    return [
      { label: "contracts", value: rows.length.toLocaleString() },
      { label: "annual spend", value: moneyShort(spend) },
      { label: "auto-renew", value: autoRenew.toLocaleString(), tone: autoRenew ? V4.amber : undefined },
      { label: "high risk", value: highRisk.toLocaleString(), tone: highRisk ? V4.red : undefined },
      { label: "service clusters", value: dimensions.toLocaleString() },
    ];
  }

  if (objectType === "data_asset_or_integration") {
    return [
      { label: "flows and assets", value: rows.length.toLocaleString() },
      { label: "regulated", value: regulated.toLocaleString(), tone: regulated ? V4.amber : undefined },
      { label: "real-time", value: rows.filter((row) => /real.?time/i.test(String(row.refreshFrequency ?? ""))).length.toLocaleString() },
      { label: "domains", value: dimensions.toLocaleString() },
      { label: "quality watch", value: rows.filter((row) => /ungoverned|developing|review/i.test(String(row.qualityStatus ?? ""))).length.toLocaleString(), tone: V4.amber },
    ];
  }

  if (objectType === "infrastructure_platform") {
    return [
      { label: "platforms", value: rows.length.toLocaleString() },
      { label: "tier 1", value: tier1.toLocaleString(), tone: tier1 ? V4.blue : undefined },
      { label: "lifecycle watch", value: lifecycleWatch.toLocaleString(), tone: lifecycleWatch ? V4.amber : undefined },
      { label: "annual cost", value: moneyShort(spend) },
      { label: "platform types", value: dimensions.toLocaleString() },
    ];
  }

  return [
    { label: "applications", value: rows.length.toLocaleString() },
    { label: "tier 1", value: tier1.toLocaleString(), tone: tier1 ? V4.blue : undefined },
    { label: "lifecycle watch", value: lifecycleWatch.toLocaleString(), tone: lifecycleWatch ? V4.amber : undefined },
    { label: "replacement candidates", value: replacement.toLocaleString(), tone: replacement ? V4.amber : undefined },
    { label: "annual cost", value: moneyShort(spend) },
  ];
}

function buildFacets(rows: RecordRow[], objectType: TechObjectType, primaryDimension?: string) {
  const preferred: Partial<Record<TechObjectType, string[]>> = {
    application_system: ["lifecycleState", "criticality", "deploymentModel", "vendor"],
    vendor_contract: ["riskRating", "commercialModel", "autoRenewFlag", "contractOwner"],
    infrastructure_platform: ["platformType", "hostingModel", "criticality", "lifecycleState"],
    data_asset_or_integration: ["integrationType", "refreshFrequency", "qualityStatus", "regulatedDataFlag"],
  };
  return (preferred[objectType] ?? [])
    .filter((field) => field !== primaryDimension)
    .map((field) => ({ field, title: labelFor(field), counts: countsFor(rows, field).slice(0, 7) }))
    .filter((facet) => facet.counts.length > 1);
}

function countsFor(rows: RecordRow[], field: string): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = bucket(row[field]);
    if (value === "(not specified)") continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function Facet({
  title,
  field,
  counts,
  activeValue,
  onToggle,
}: {
  title: string;
  field: string;
  counts: Array<[string, number]>;
  activeValue: string | null;
  onToggle: (field: string, value: string) => void;
}) {
  const max = Math.max(1, ...counts.map(([, count]) => count));
  return (
    <section>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
        <span style={eyebrow(V4.slate)}>{title}</span>
        {activeValue ? <span style={{ fontFamily: MONO, fontSize: 11, color: V4.blue }}>filtered</span> : null}
      </div>
      <div style={{ display: "grid", gap: 5 }}>
        {counts.map(([label, count]) => {
          const active = activeValue === label;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onToggle(field, label)}
              aria-pressed={active}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0,1fr) 44px",
                gap: 8,
                alignItems: "center",
                border: "none",
                borderRadius: 5,
                background: active ? "rgba(0,102,204,0.08)" : "transparent",
                padding: "5px 6px",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <span style={{ minWidth: 0 }}>
                <span style={facetLabelStyle} title={label}>{humanise(label)}</span>
                <span style={facetBarTrackStyle}>
                  <span style={{ ...facetBarStyle, width: `${(count / max) * 100}%` }} />
                </span>
              </span>
              <span style={facetCountStyle}>{count.toLocaleString()}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function FilterChip({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        border: `1px solid ${active ? V4.navy : V4.rule}`,
        borderRadius: 999,
        background: active ? V4.navy : V4.surface,
        color: active ? V4.paper : V4.inkSoft,
        padding: "7px 11px",
        display: "inline-flex",
        gap: 8,
        alignItems: "baseline",
        fontFamily: SANS,
        fontSize: 12.5,
        cursor: "pointer",
      }}
    >
      <span style={{ maxWidth: 240, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{humanise(label)}</span>
      <span style={{ fontFamily: MONO, fontSize: 11, opacity: 0.74 }}>{count.toLocaleString()}</span>
    </button>
  );
}

function SelectedRecord({
  recordType,
  row,
  ordinal,
  fieldCount,
}: {
  recordType: TechObjectType;
  row: RecordRow;
  ordinal: number;
  fieldCount: number;
}) {
  const fields = (DETAIL_FIELDS[recordType] ?? Object.keys(row)).filter((field) => field in row);
  const title = titleForSelected(recordType, row);
  return (
    <section style={selectedStyle}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <span style={eyebrow(V4.blue)}>Selected record</span>
        <span style={{ fontFamily: MONO, fontSize: 11, color: V4.slate }}>#{ordinal.toLocaleString()}</span>
      </div>
      <h2 style={selectedTitleStyle}>{title}</h2>
      <div style={selectedMetaStyle}>{fieldCount.toLocaleString()} fields in source projection</div>
      <dl style={detailGridStyle}>
        {fields.slice(0, 18).map((field) => (
          <div key={field} style={{ display: "grid", gap: 3 }}>
            <dt style={detailLabelStyle}>{labelFor(field)}</dt>
            <dd style={detailValueStyle}>{formatByField(field, row[field])}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function CellValue({ value, column }: { value: unknown; column: Column }) {
  if (column.kind === "pill") {
    const text = humanise(value);
    const tone = PILL_TONE[String(value ?? "").toLowerCase()] ?? { bg: V4.cream, fg: V4.slate };
    return <span style={{ ...pillStyle, background: tone.bg, color: tone.fg }}>{text}</span>;
  }
  return <>{formatByField(column.key, value)}</>;
}

function headlineFor(objectType: TechObjectType, count: number): string {
  if (objectType === "application_system") return `${count.toLocaleString()} applications, grouped by the way the estate actually runs.`;
  if (objectType === "vendor_contract") return `${count.toLocaleString()} contracts, with spend, renewal and risk visible together.`;
  if (objectType === "infrastructure_platform") return `${count.toLocaleString()} platforms, from data centers to managed services.`;
  if (objectType === "data_asset_or_integration") return `${count.toLocaleString()} data movements and assets, source to target.`;
  return `${count.toLocaleString()} records.`;
}

function titleForSelected(objectType: TechObjectType, row: RecordRow): string {
  const fieldByType: Partial<Record<TechObjectType, string>> = {
    application_system: "systemName",
    vendor_contract: "contractName",
    infrastructure_platform: "platformName",
    data_asset_or_integration: "dataAssetName",
  };
  return humanise(row[fieldByType[objectType] ?? "name"]);
}

function rowKey(row: RecordRow, index: number): string {
  return String(row.originalRowId ?? row.systemId ?? row.vendorId ?? row.infrastructureId ?? row.dataAssetId ?? `${titleForSelected("application_system", row)}-${index}`);
}

function bucket(value: unknown): string {
  if (value === null || value === undefined || value === "") return "(not specified)";
  return String(value);
}

function humanise(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value).replace(/_/g, " ");
}

function labelFor(field: string): string {
  return field
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function numeric(value: unknown): number {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

function isTruthy(value: unknown): boolean {
  return ["true", "yes", "1"].includes(String(value ?? "").toLowerCase());
}

function moneyShort(value: number): string {
  if (!value) return "—";
  if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function formatByField(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (/annual.*(cost|spend)|exitCost/i.test(field)) return moneyShort(numeric(value));
  if (/pct|percent/i.test(field)) return `${numeric(value).toLocaleString()}%`;
  if (typeof value === "number") return value.toLocaleString();
  return humanise(value);
}

const titleStyle: CSSProperties = {
  fontFamily: SERIF,
  fontWeight: 500,
  fontSize: "clamp(30px,2.6vw,42px)",
  lineHeight: 1.1,
  letterSpacing: "-0.028em",
  margin: "14px 0 0",
  maxWidth: "34ch",
  textWrap: "balance",
};

const metaLineStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px 18px",
  marginTop: 18,
  fontFamily: MONO,
  fontSize: 11,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: V4.slate,
};

const metricGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5,minmax(0,1fr))",
  borderTop: `1px solid ${V4.rule}`,
  borderBottom: `1px solid ${V4.rule}`,
  marginTop: 30,
};

const metricStyle: CSSProperties = {
  padding: "15px 18px 15px 0",
  minWidth: 0,
};

const metricValueStyle: CSSProperties = {
  display: "block",
  fontFamily: SERIF,
  fontSize: 27,
  fontWeight: 500,
  letterSpacing: "-0.03em",
  lineHeight: 1,
  fontVariantNumeric: "tabular-nums",
};

const metricLabelStyle: CSSProperties = {
  display: "block",
  marginTop: 7,
  fontFamily: SANS,
  fontSize: 11.5,
  lineHeight: 1.4,
  color: V4.slate,
};

const controlsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1fr) auto",
  gap: 12,
  alignItems: "center",
  marginTop: 24,
};

const searchStyle: CSSProperties = {
  width: "100%",
  border: `1px solid ${V4.ruleStrong}`,
  borderRadius: 7,
  background: V4.surface,
  color: V4.ink,
  fontFamily: SANS,
  fontSize: 14,
  padding: "10px 12px",
};

const countStyle: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: 8,
  fontFamily: MONO,
  fontSize: 11,
  color: V4.slate,
  whiteSpace: "nowrap",
};

const clearButtonStyle: CSSProperties = {
  border: "none",
  background: "transparent",
  color: V4.blue,
  fontFamily: MONO,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  cursor: "pointer",
};

const primaryBandStyle: CSSProperties = {
  marginTop: 20,
  padding: "16px 18px 18px",
  border: `1px solid ${V4.rule}`,
  borderRadius: 10,
  background: "linear-gradient(90deg,rgba(255,255,255,0.86),rgba(0,102,204,0.045))",
};

const layoutStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1fr) minmax(300px,360px)",
  gap: "clamp(24px,3vw,42px)",
  marginTop: 28,
  alignItems: "start",
};

const tableShellStyle: CSSProperties = {
  overflowX: "auto",
  border: `1px solid ${V4.rule}`,
  borderRadius: 10,
  background: V4.surface,
  boxShadow: "0 14px 32px rgba(12,26,58,0.055)",
};

const tableStyle: CSSProperties = {
  width: "100%",
  minWidth: 980,
  borderCollapse: "collapse",
  tableLayout: "fixed",
};

const headerCellStyle: CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 1,
  padding: "11px 12px",
  borderBottom: `1px solid ${V4.rule}`,
  background: V4.cream,
  fontFamily: MONO,
  fontSize: 10.5,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: V4.slate,
};

const bodyCellStyle: CSSProperties = {
  padding: "10px 12px",
  borderBottom: `1px solid ${V4.rule}`,
  fontSize: 12.5,
  lineHeight: 1.35,
  verticalAlign: "top",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const footnoteStyle: CSSProperties = {
  margin: "12px 0 0",
  fontFamily: MONO,
  fontSize: 11,
  letterSpacing: "0.05em",
  color: V4.slate,
};

const emptyStyle: CSSProperties = {
  margin: 0,
  padding: 18,
  fontFamily: SANS,
  fontSize: 13,
  color: V4.slate,
};

const detailPaneStyle: CSSProperties = {
  position: "sticky",
  top: 26,
  minWidth: 0,
  display: "grid",
  gap: 26,
};

const selectedStyle: CSSProperties = {
  border: `1px solid ${V4.rule}`,
  borderTop: `4px solid ${V4.blue}`,
  borderRadius: 10,
  background: V4.surface,
  padding: "16px 17px 18px",
  boxShadow: "0 14px 32px rgba(12,26,58,0.055)",
};

const selectedTitleStyle: CSSProperties = {
  margin: "10px 0 0",
  fontFamily: SERIF,
  fontSize: 24,
  fontWeight: 500,
  letterSpacing: "-0.024em",
  lineHeight: 1.15,
  color: V4.ink,
};

const selectedMetaStyle: CSSProperties = {
  marginTop: 8,
  fontFamily: MONO,
  fontSize: 11,
  letterSpacing: "0.06em",
  color: V4.slate,
  textTransform: "uppercase",
};

const detailGridStyle: CSSProperties = {
  display: "grid",
  gap: 12,
  margin: "18px 0 0",
};

const detailLabelStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: 10.5,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: V4.slate,
};

const detailValueStyle: CSSProperties = {
  margin: 0,
  fontFamily: SANS,
  fontSize: 13.2,
  lineHeight: 1.45,
  color: V4.inkSoft,
  overflowWrap: "anywhere",
};

const facetLabelStyle: CSSProperties = {
  display: "block",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontFamily: SANS,
  fontSize: 12.2,
  color: V4.inkSoft,
};

const facetBarTrackStyle: CSSProperties = {
  display: "block",
  height: 3,
  background: V4.cream,
  borderRadius: 2,
  overflow: "hidden",
  marginTop: 4,
};

const facetBarStyle: CSSProperties = {
  display: "block",
  height: "100%",
  background: "rgba(12,26,58,0.56)",
};

const facetCountStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: 11,
  color: V4.slate,
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
};

const pillStyle: CSSProperties = {
  display: "inline-block",
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  borderRadius: 3,
  padding: "3px 7px",
  fontFamily: MONO,
  fontSize: 10.8,
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};
