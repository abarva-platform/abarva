"use client";

import { useMemo, useState, type CSSProperties } from "react";

import type { TechObjectType, TechRecordType } from "@/lib/home/preview/types";
import { cellText } from "./cxo-language";
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

interface Dimension {
  field: string;
  title: string;
  counts: Array<[string, number]>;
}

const COLUMN_PRESETS: Record<TechObjectType, Column[]> = {
  metric_outcome: [
    { key: "metricName", label: "Metric", width: 260, priority: "core" },
    { key: "businessFunction", label: "Function", width: 190 },
    { key: "baselineValue", label: "Baseline", width: 110, kind: "mono" },
    { key: "targetValue", label: "Target", width: 130, kind: "mono" },
    {
      key: "claimReadiness",
      label: "Claim readiness",
      width: 150,
      kind: "mono",
    },
    {
      key: "claimBlockedReason",
      label: "Blocked because",
      width: 260,
      kind: "muted",
    },
    {
      key: "unblockAction",
      label: "Unblock action",
      width: 260,
      kind: "muted",
    },
    { key: "owner", label: "Owner", width: 200 },
  ],
  risk_control: [
    {
      key: "riskOrControlName",
      label: "Risk or control",
      width: 280,
      priority: "core",
    },
    { key: "riskDomain", label: "Domain", width: 160 },
    { key: "severity", label: "Severity", width: 100, kind: "mono" },
    { key: "controlStatus", label: "Control", width: 120, kind: "mono" },
    {
      key: "systemsImpacted",
      label: "Systems impacted",
      width: 260,
      kind: "muted",
    },
    {
      key: "remediationCostUsd",
      label: "Remediation",
      width: 130,
      kind: "mono",
    },
    { key: "controlOwner", label: "Owner", width: 200 },
  ],
  program_initiative: [
    { key: "programName", label: "Program", width: 280, priority: "core" },
    { key: "status", label: "Status", width: 130, kind: "mono" },
    { key: "pctComplete", label: "Complete", width: 100, kind: "mono" },
    { key: "budgetUsd", label: "Budget", width: 120, kind: "mono" },
    {
      key: "expectedValueUsd",
      label: "Expected value",
      width: 140,
      kind: "mono",
    },
    {
      key: "blockedReason",
      label: "Blocked because",
      width: 280,
      kind: "muted",
    },
    { key: "businessSponsor", label: "Sponsor", width: 220 },
  ],
  organization_ownership: [
    { key: "orgUnit", label: "Org unit", width: 250, priority: "core" },
    { key: "leaderNameOrRole", label: "Leader", width: 230 },
    { key: "roleLevel", label: "Level", width: 100, kind: "mono" },
    { key: "decisionRights", label: "Decides", width: 300, kind: "muted" },
    {
      key: "budgetAuthorityUsd",
      label: "Budget authority",
      width: 150,
      kind: "mono",
    },
    { key: "ownedSystems", label: "Owns systems", width: 240, kind: "muted" },
  ],
  ai_use_case: [
    { key: "useCaseName", label: "Use case", width: 270, priority: "core" },
    { key: "businessSegment", label: "Segment", width: 200 },
    { key: "currentStatus", label: "Status", width: 180, kind: "mono" },
    { key: "aiPattern", label: "Pattern", width: 190, kind: "mono" },
    {
      key: "financeValidatedValueUsd",
      label: "Validated value",
      width: 150,
      kind: "mono",
    },
    {
      key: "realizedValueAllowed",
      label: "May book value",
      width: 130,
      kind: "mono",
    },
  ],
  application_system: [
    { key: "systemName", label: "System", width: 250, priority: "core" },
    { key: "businessFunction", label: "Function", width: 190 },
    { key: "systemCategory", label: "Category", width: 210, kind: "muted" },
    { key: "criticality", label: "Criticality", width: 104, kind: "mono" },
    { key: "lifecycleState", label: "Lifecycle", width: 138, kind: "pill" },
    {
      key: "vendor",
      label: "Vendor",
      width: 160,
      priority: "wide",
      kind: "muted",
    },
    {
      key: "interfacesCount",
      label: "Interfaces",
      width: 96,
      priority: "wide",
      align: "right",
      kind: "mono",
    },
    {
      key: "annualCostUsd",
      label: "Annual cost",
      width: 126,
      priority: "wide",
      align: "right",
      kind: "money",
    },
  ],
  vendor_contract: [
    { key: "vendorName", label: "Vendor", width: 230, priority: "core" },
    { key: "contractName", label: "Contract", width: 260 },
    { key: "serviceCategory", label: "Service", width: 220, kind: "muted" },
    {
      key: "annualSpendUsd",
      label: "Annual spend",
      width: 132,
      align: "right",
      kind: "money",
    },
    { key: "renewalDate", label: "Renewal", width: 112, kind: "mono" },
    { key: "riskRating", label: "Risk", width: 96, kind: "pill" },
    {
      key: "autoRenewFlag",
      label: "Auto-renew",
      width: 112,
      priority: "wide",
      kind: "mono",
    },
  ],
  infrastructure_platform: [
    { key: "platformName", label: "Platform", width: 250, priority: "core" },
    { key: "platformType", label: "Type", width: 190 },
    { key: "hostingModel", label: "Hosting", width: 142, kind: "mono" },
    { key: "criticality", label: "Criticality", width: 104, kind: "mono" },
    { key: "lifecycleState", label: "Lifecycle", width: 138, kind: "pill" },
    {
      key: "utilizationPct",
      label: "Util.",
      width: 78,
      priority: "wide",
      align: "right",
      kind: "mono",
    },
    {
      key: "capacityHeadroomPct",
      label: "Headroom",
      width: 96,
      priority: "wide",
      align: "right",
      kind: "mono",
    },
    {
      key: "annualCostUsd",
      label: "Annual cost",
      width: 126,
      priority: "wide",
      align: "right",
      kind: "money",
    },
  ],
  data_asset_or_integration: [
    {
      key: "recordKind",
      label: "Record kind",
      width: 142,
      priority: "wide",
      kind: "pill",
    },
    { key: "dataAssetName", label: "Asset", width: 250, priority: "core" },
    { key: "dataDomain", label: "Domain", width: 170 },
    { key: "sourceSystem", label: "Source", width: 210 },
    { key: "targetSystem", label: "Target", width: 230 },
    { key: "integrationType", label: "Mechanism", width: 170, kind: "muted" },
    {
      key: "workloadType",
      label: "Workload",
      width: 118,
      priority: "wide",
      kind: "pill",
    },
    {
      key: "technologyName",
      label: "Technology",
      width: 160,
      priority: "wide",
    },
    {
      key: "workloadCount",
      label: "Items",
      width: 86,
      priority: "wide",
      align: "right",
      kind: "mono",
    },
    {
      key: "activeUserCount",
      label: "Users",
      width: 92,
      priority: "wide",
      align: "right",
      kind: "mono",
    },
    {
      key: "dataVolumeTb",
      label: "TB",
      width: 78,
      priority: "wide",
      align: "right",
      kind: "mono",
    },
    {
      key: "refreshFrequency",
      label: "Refresh",
      width: 106,
      priority: "wide",
      kind: "mono",
    },
    {
      key: "qualityStatus",
      label: "Quality",
      width: 154,
      priority: "wide",
      kind: "pill",
    },
    {
      key: "regulatedDataFlag",
      label: "Reg.",
      width: 72,
      priority: "wide",
      align: "right",
      kind: "mono",
    },
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
    "recordKind",
    "dataDomain",
    "ownerFunction",
    "sourceSystem",
    "targetSystem",
    "integrationType",
    "workloadType",
    "platformName",
    "technologyName",
    "workloadCount",
    "activeUserCount",
    "dataVolumeTb",
    "governanceState",
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

/**
 * Columns whose value never varies across the whole record type.
 *
 * A column reading the same value on every row carries no information: it is a default that was
 * never filled in, not an assessment that came back clean. Rendering 225 green rows for a succession
 * risk nobody assessed is two true facts -- the column exists, the value is low -- combining into a
 * false statement, and it is the same defect as a cost column that is constant per tier.
 *
 * This is the same detector the source-intelligence digests use to collapse a repeated column before
 * a file reaches a model. One detector, two uses: it compresses the prompt and it reports the
 * quality problem, because they are the same observation.
 */
function constantColumnsOf(
  rows: RecordRow[],
  columns: string[],
): Array<{ column: string; value: string }> {
  if (rows.length < 2) return [];
  const out: Array<{ column: string; value: string }> = [];
  for (const column of columns) {
    const values = new Set(rows.map((row) => String(row[column] ?? "").trim()));
    values.delete("");
    if (
      values.size === 1 &&
      rows.every((row) => String(row[column] ?? "").trim())
    ) {
      out.push({ column, value: [...values][0] });
    }
  }
  return out;
}

export function RecordBrowser({
  recordType,
  initialQuery,
}: {
  recordType: TechRecordType;
  /**
   * A search the browser opens already applied.
   *
   * This is what a figure's "open these rows" control passes: a reader who doubts a number lands on
   * the rows behind it rather than on the whole record type with the filtering left to them. The
   * banner above the table says what was applied, so an arriving reader is never looking at a
   * filtered view without being told.
   */
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [sliceField, setSliceField] = useState<string | null>(null);
  const [sliceValue, setSliceValue] = useState("all");
  const [diceField, setDiceField] = useState("none");
  const [diceValue, setDiceValue] = useState("all");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const rows = useMemo(
    () => (recordType.rows ?? []) as RecordRow[],
    [recordType.rows],
  );
  const indexedRows = useMemo(
    () => rows.map((row, index) => ({ row, index, key: rowKey(row, index) })),
    [rows],
  );
  const columns = useMemo(() => columnsFor(recordType), [recordType]);
  const primaryDimension = recordType.primaryDimension ?? undefined;

  const dimensions = useMemo(
    () => buildDimensions(rows, recordType.objectType, primaryDimension),
    [rows, recordType.objectType, primaryDimension],
  );
  const defaultSliceField = dimensions[0]?.field ?? primaryDimension ?? "";
  const activeSliceField = dimensions.some(
    (dimension) => dimension.field === sliceField,
  )
    ? sliceField!
    : defaultSliceField;
  const activeSlice = dimensions.find(
    (dimension) => dimension.field === activeSliceField,
  );
  const diceDimensions = dimensions.filter(
    (dimension) => dimension.field !== activeSliceField,
  );
  const activeDiceField = diceDimensions.some(
    (dimension) => dimension.field === diceField,
  )
    ? diceField
    : "none";
  const activeDice = dimensions.find(
    (dimension) => dimension.field === activeDiceField,
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return indexedRows.filter(({ row }) => {
      if (
        activeSlice &&
        sliceValue !== "all" &&
        bucket(row[activeSlice.field]) !== sliceValue
      )
        return false;
      if (
        activeDice &&
        diceValue !== "all" &&
        bucket(row[activeDice.field]) !== diceValue
      )
        return false;
      if (!q) return true;
      return (recordType.columns ?? Object.keys(row)).some((field) =>
        String(row[field] ?? "")
          .toLowerCase()
          .includes(q),
      );
    });
  }, [
    activeDice,
    activeSlice,
    diceValue,
    indexedRows,
    query,
    recordType.columns,
    sliceValue,
  ]);

  const shown = filtered.slice(0, 120);
  const filteredRows = useMemo(
    () => filtered.map(({ row }) => row),
    [filtered],
  );
  const selected =
    filtered.find((r) => r.key === selectedKey) ??
    filtered[0] ??
    indexedRows[0];
  const metrics = useMemo(
    () => buildMetrics(rows, recordType.objectType, primaryDimension),
    [rows, recordType.objectType, primaryDimension],
  );
  const fieldCount =
    recordType.columns?.length ?? Object.keys(rows[0] ?? {}).length;
  const activeFilterCount =
    Number(sliceValue !== "all") +
    Number(diceValue !== "all") +
    Number(Boolean(query.trim()));

  function clearFilters() {
    setQuery("");
    setSliceValue("all");
    setDiceValue("all");
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
          [data-record-controls], [data-cube-controls] { grid-template-columns: 1fr !important; }
          [data-cube-frame] { grid-template-columns: 1fr !important; }
          [data-relationship-header] { grid-template-columns: 1fr !important; }
          table[data-records] { min-width: 0 !important; }
          table[data-records] th:not([data-priority="core"]),
          table[data-records] td:not([data-priority="core"]) { display: none; }
        }
      `}</style>

      <header style={{ maxWidth: 1120 }}>
        <span style={eyebrow(V4.blue)}>
          Record browser · {recordType.label}
        </span>
        <h1 style={titleStyle}>
          {headlineFor(recordType.objectType, rows.length)}
        </h1>
        <div style={metaLineStyle}>
          <span>{rows.length.toLocaleString()} records</span>
          <span>{fieldCount.toLocaleString()} source fields</span>
          {primaryDimension ? (
            <span>clustered by {labelFor(primaryDimension)}</span>
          ) : null}
        </div>
      </header>

      <section data-record-metrics style={metricGridStyle}>
        {metrics.map((metric) => (
          <div key={metric.label} style={metricStyle}>
            <span style={{ ...metricValueStyle, color: metric.tone ?? V4.ink }}>
              {metric.value}
            </span>
            <span style={metricLabelStyle}>{metric.label}</span>
          </div>
        ))}
      </section>

      <section data-cube-frame style={cubeFrameStyle}>
        <div style={{ minWidth: 0 }}>
          <span style={eyebrow(V4.green)}>Slice / dice viewer</span>
          <h2 style={cubeTitleStyle}>
            Explore this record as a governed cube.
          </h2>
          <p style={cubeTextStyle}>
            Pick dimensions to narrow the estate without losing the underlying
            rows. The table below remains the full source record for the current
            slice.
          </p>
        </div>
        <div data-cube-controls style={cubeControlsStyle}>
          <DimensionSelect
            label="Slice by"
            value={activeSliceField}
            options={dimensions}
            onChange={(next) => {
              setSliceField(next);
              setSliceValue("all");
              if (next === diceField) {
                setDiceField("none");
                setDiceValue("all");
              }
            }}
          />
          <ValueSelect
            label="Slice value"
            value={sliceValue}
            counts={activeSlice?.counts ?? []}
            onChange={setSliceValue}
          />
          <DimensionSelect
            label="Dice by"
            value={activeDiceField}
            options={diceDimensions}
            includeNone
            onChange={(next) => {
              setDiceField(next);
              setDiceValue("all");
            }}
          />
          <ValueSelect
            label="Dice value"
            value={diceValue}
            counts={activeDice?.counts ?? []}
            disabled={activeDiceField === "none"}
            onChange={setDiceValue}
          />
        </div>
        {activeSlice ? (
          <DistributionStrip
            title={activeSlice.title}
            counts={activeSlice.counts}
            activeValue={sliceValue}
            onSelect={setSliceValue}
          />
        ) : null}
      </section>

      <RelationshipLens
        objectType={recordType.objectType}
        rows={filteredRows}
      />

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
            <button
              type="button"
              onClick={clearFilters}
              style={clearButtonStyle}
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {initialQuery && query === initialQuery ? (
        <div
          data-record-arrived-filtered
          style={{
            margin: "0 0 14px",
            background: V4.surface,
            border: `1px solid ${V4.rule}`,
            borderLeft: `3px solid ${V4.blue}`,
            padding: "12px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 18,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontFamily: SANS, fontSize: 13.5, lineHeight: 1.45 }}>
            Showing the rows behind a figure you came from — filtered to{" "}
            <strong style={{ fontWeight: 600 }}>{initialQuery}</strong>.
          </span>
          <button
            type="button"
            onClick={() => setQuery("")}
            style={{
              fontFamily: MONO,
              fontSize: 11,
              background: "transparent",
              border: `1px solid ${V4.rule}`,
              padding: "5px 11px",
              cursor: "pointer",
              color: V4.inkSoft,
            }}
          >
            Show all {rows.length.toLocaleString()}
          </button>
        </div>
      ) : null}

      {(() => {
        const constants = constantColumnsOf(rows, recordType.columns);
        if (constants.length === 0) return null;
        return (
          <div
            data-record-constant-columns={constants.length}
            style={{
              margin: "0 0 16px",
              background: V4.surface,
              border: `1px solid ${V4.rule}`,
              borderLeft: `3px solid ${V4.amber}`,
              padding: "13px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 5,
            }}
          >
            <span style={eyebrow(V4.amber)}>
              {constants.length === 1
                ? "One column carries no information"
                : `${constants.length} columns carry no information`}
            </span>
            <p
              style={{
                margin: 0,
                fontFamily: SANS,
                fontSize: 13.5,
                lineHeight: 1.5,
                color: V4.inkSoft,
                maxWidth: "82ch",
              }}
            >
              {constants
                .map(
                  (c) =>
                    `${c.column} reads "${cellText(c.value)}" on all ${rows.length.toLocaleString()} rows`,
                )
                .join("; ")}
              . A value that never varies is a default rather than an
              assessment, so nothing here should be read as a clean result.
            </p>
          </div>
        );
      })()}

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
                      background:
                        selected?.key === key
                          ? "rgba(0,102,204,0.055)"
                          : V4.surface,
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
                          fontFamily:
                            column.kind === "mono" || column.kind === "money"
                              ? MONO
                              : SANS,
                          color:
                            column.kind === "muted" ? V4.slate : V4.inkSoft,
                          fontVariantNumeric:
                            column.align === "right" || column.kind === "money"
                              ? "tabular-nums"
                              : undefined,
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
            Showing {shown.length.toLocaleString()} of{" "}
            {filtered.length.toLocaleString()} matched records
            {filtered.length > shown.length ? " · first page only" : ""}.
          </p>
        </section>

        <aside data-detail-pane style={detailPaneStyle}>
          <SliceSummary
            shown={filtered.length}
            total={rows.length}
            slice={activeSlice}
            sliceValue={sliceValue}
            dice={activeDice}
            diceValue={diceValue}
          />

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
  const available = new Set(
    recordType.columns ?? Object.keys(recordType.rows?.[0] ?? {}),
  );
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

function buildMetrics(
  rows: RecordRow[],
  objectType: TechObjectType,
  primaryDimension?: string,
): Metric[] {
  const lifecycleWatch = rows.filter((row) =>
    ["legacy_stable", "sunset_planned", "deprecated"].includes(
      String(row.lifecycleState ?? ""),
    ),
  ).length;
  const regulated = rows.filter((row) =>
    ["true", "yes", "phi", "hipaa"].some((needle) =>
      `${row.regulatedDataFlag ?? ""} ${row.dataClassification ?? ""} ${row.complianceScope ?? ""}`
        .toLowerCase()
        .includes(needle),
    ),
  ).length;
  const replacement = rows.filter(
    (row) => String(row.replacementCandidate ?? "").toLowerCase() === "yes",
  ).length;
  const tier1 = rows.filter((row) => isTierOne(row.criticality)).length;
  const spendField = rows.some((row) => row.annualSpendUsd !== undefined)
    ? "annualSpendUsd"
    : "annualCostUsd";
  const spend = rows.reduce((sum, row) => sum + numeric(row[spendField]), 0);
  const dimensions = primaryDimension
    ? new Set(
        rows
          .map((row) => bucket(row[primaryDimension]))
          .filter((v) => v !== "(not specified)"),
      ).size
    : 0;

  if (objectType === "vendor_contract") {
    const autoRenew = rows.filter((row) => isTruthy(row.autoRenewFlag)).length;
    const highRisk = rows.filter(
      (row) => String(row.riskRating ?? "").toLowerCase() === "high",
    ).length;
    return [
      { label: "contracts", value: rows.length.toLocaleString() },
      { label: "annual spend", value: moneyShort(spend) },
      {
        label: "auto-renew",
        value: autoRenew.toLocaleString(),
        tone: autoRenew ? V4.amber : undefined,
      },
      {
        label: "high risk",
        value: highRisk.toLocaleString(),
        tone: highRisk ? V4.red : undefined,
      },
      { label: "service clusters", value: dimensions.toLocaleString() },
    ];
  }

  if (objectType === "data_asset_or_integration") {
    const movements = rows.filter(
      (row) => row.recordKind !== "data_analytics_workload",
    );
    const workloads = rows.filter(
      (row) => row.recordKind === "data_analytics_workload",
    );
    const workloadItems = workloads.reduce(
      (sum, row) => sum + numeric(row.workloadCount),
      0,
    );
    const activeUsers = workloads.reduce(
      (sum, row) => sum + numeric(row.activeUserCount),
      0,
    );
    const dataVolume = workloads.reduce(
      (sum, row) => sum + numeric(row.dataVolumeTb),
      0,
    );
    return [
      { label: "movements", value: movements.length.toLocaleString() },
      {
        label: "workload segments",
        value: workloads.length.toLocaleString(),
        tone: workloads.length ? V4.green : undefined,
      },
      {
        label: "workload items",
        value: workloadItems.toLocaleString(),
        tone: workloadItems ? V4.blue : undefined,
      },
      {
        label: "active users",
        value: activeUsers.toLocaleString(),
        tone: activeUsers ? V4.blue : undefined,
      },
      {
        label: "data volume",
        value: `${Number(dataVolume.toFixed(1)).toLocaleString()} TB`,
        tone: dataVolume ? V4.blue : undefined,
      },
      {
        label: "regulated",
        value: regulated.toLocaleString(),
        tone: regulated ? V4.amber : undefined,
      },
    ];
  }

  if (objectType === "infrastructure_platform") {
    return [
      { label: "platforms", value: rows.length.toLocaleString() },
      {
        label: "tier 1",
        value: tier1.toLocaleString(),
        tone: tier1 ? V4.blue : undefined,
      },
      {
        label: "lifecycle watch",
        value: lifecycleWatch.toLocaleString(),
        tone: lifecycleWatch ? V4.amber : undefined,
      },
      { label: "annual cost", value: moneyShort(spend) },
      { label: "platform types", value: dimensions.toLocaleString() },
    ];
  }

  return [
    { label: "applications", value: rows.length.toLocaleString() },
    {
      label: "tier 1",
      value: tier1.toLocaleString(),
      tone: tier1 ? V4.blue : undefined,
    },
    {
      label: "lifecycle watch",
      value: lifecycleWatch.toLocaleString(),
      tone: lifecycleWatch ? V4.amber : undefined,
    },
    {
      label: "replacement candidates",
      value: replacement.toLocaleString(),
      tone: replacement ? V4.amber : undefined,
    },
    { label: "annual cost", value: moneyShort(spend) },
  ];
}

function buildDimensions(
  rows: RecordRow[],
  objectType: TechObjectType,
  primaryDimension?: string,
): Dimension[] {
  const preferred: Partial<Record<TechObjectType, string[]>> = {
    application_system: [
      "lifecycleState",
      "criticality",
      "deploymentModel",
      "vendor",
    ],
    vendor_contract: [
      "riskRating",
      "commercialModel",
      "autoRenewFlag",
      "contractOwner",
    ],
    infrastructure_platform: [
      "platformType",
      "hostingModel",
      "criticality",
      "lifecycleState",
    ],
    data_asset_or_integration: [
      "recordKind",
      "workloadType",
      "technologyName",
      "integrationType",
      "refreshFrequency",
      "qualityStatus",
      "regulatedDataFlag",
    ],
  };
  const fields = unique(
    [primaryDimension, ...(preferred[objectType] ?? [])].filter(
      Boolean,
    ) as string[],
  );
  return fields
    .map((field) => ({
      field,
      title: labelFor(field),
      counts: countsFor(rows, field),
    }))
    .filter((dimension) => dimension.counts.length > 1);
}

function countsFor(rows: RecordRow[], field: string): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = bucket(row[field]);
    if (value === "(not specified)") continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function DimensionSelect({
  label,
  value,
  options,
  includeNone,
  onChange,
}: {
  label: string;
  value: string;
  options: Dimension[];
  includeNone?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label style={selectLabelStyle}>
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={cubeSelectStyle}
      >
        {includeNone ? <option value="none">No second dimension</option> : null}
        {options.map((option) => (
          <option key={option.field} value={option.field}>
            {option.title}
          </option>
        ))}
      </select>
    </label>
  );
}

function ValueSelect({
  label,
  value,
  counts,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  counts: Array<[string, number]>;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label style={selectLabelStyle}>
      <span>{label}</span>
      <select
        value={disabled ? "all" : value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        style={cubeSelectStyle}
      >
        <option value="all">All values</option>
        {counts.map(([option, count]) => (
          <option key={option} value={option}>
            {humanise(option)} ({count.toLocaleString()})
          </option>
        ))}
      </select>
    </label>
  );
}

function DistributionStrip({
  title,
  counts,
  activeValue,
  onSelect,
}: {
  title: string;
  counts: Array<[string, number]>;
  activeValue: string;
  onSelect: (value: string) => void;
}) {
  const shown = counts.slice(0, 8);
  const max = Math.max(1, ...shown.map(([, count]) => count));
  return (
    <div style={distributionStyle}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <span style={eyebrow(V4.slate)}>{title} distribution</span>
        <span style={{ fontFamily: MONO, fontSize: 11, color: V4.slate }}>
          {counts.length.toLocaleString()} values
        </span>
      </div>
      <div style={distributionGridStyle}>
        <button
          type="button"
          onClick={() => onSelect("all")}
          style={{
            ...distributionButtonStyle,
            borderColor: activeValue === "all" ? V4.blue : V4.rule,
          }}
        >
          <span style={distributionLabelStyle}>All values</span>
          <span style={distributionTrackStyle}>
            <span style={{ ...distributionFillStyle, width: "100%" }} />
          </span>
        </button>
        {shown.map(([label, count]) => (
          <button
            key={label}
            type="button"
            onClick={() => onSelect(activeValue === label ? "all" : label)}
            style={{
              ...distributionButtonStyle,
              borderColor: activeValue === label ? V4.blue : V4.rule,
            }}
          >
            <span style={distributionLabelStyle} title={label}>
              {humanise(label)}
            </span>
            <span style={distributionTrackStyle}>
              <span
                style={{
                  ...distributionFillStyle,
                  width: `${Math.max(7, (count / max) * 100)}%`,
                }}
              />
            </span>
            <span style={distributionCountStyle}>{count.toLocaleString()}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SliceSummary({
  shown,
  total,
  slice,
  sliceValue,
  dice,
  diceValue,
}: {
  shown: number;
  total: number;
  slice?: Dimension;
  sliceValue: string;
  dice?: Dimension;
  diceValue: string;
}) {
  return (
    <section style={sliceSummaryStyle}>
      <span style={eyebrow(V4.green)}>Current slice</span>
      <strong style={sliceSummaryValueStyle}>{shown.toLocaleString()}</strong>
      <span style={sliceSummaryLabelStyle}>
        of {total.toLocaleString()} records shown
      </span>
      <div style={sliceRuleStyle} />
      <SummaryRow
        label={slice?.title ?? "Slice"}
        value={sliceValue === "all" ? "All values" : humanise(sliceValue)}
      />
      <SummaryRow
        label={dice?.title ?? "Dice"}
        value={
          !dice || diceValue === "all" ? "All values" : humanise(diceValue)
        }
      />
    </section>
  );
}

function RelationshipLens({
  objectType,
  rows,
}: {
  objectType: TechObjectType;
  rows: RecordRow[];
}) {
  const pairs = relationshipPairsFor(objectType, rows);
  const [selectedPair, setSelectedPair] = useState(pairs[0]?.key ?? "");
  const activePair =
    pairs.find((pair) => pair.key === selectedPair) ?? pairs[0];
  if (!activePair) return null;
  const matrix = buildRelationshipMatrix(
    rows,
    activePair.left,
    activePair.right,
  ).slice(0, 8);

  return (
    <section style={relationshipLensStyle}>
      <div data-relationship-header style={relationshipHeaderStyle}>
        <div>
          <span style={eyebrow(V4.blue)}>Relationship lens</span>
          <h2 style={relationshipTitleStyle}>{activePair.title}</h2>
          <p style={relationshipTextStyle}>{activePair.caption}</p>
        </div>
        <label style={{ ...selectLabelStyle, minWidth: 240 }}>
          <span>Relationship</span>
          <select
            value={activePair.key}
            onChange={(event) => setSelectedPair(event.target.value)}
            style={cubeSelectStyle}
          >
            {pairs.map((pair) => (
              <option key={pair.key} value={pair.key}>
                {pair.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div style={relationshipGridStyle}>
        {matrix.map((entry) => (
          <RelationshipCard key={entry.leftValue} entry={entry} />
        ))}
      </div>
    </section>
  );
}

function RelationshipCard({
  entry,
}: {
  entry: {
    leftValue: string;
    count: number;
    rightCounts: Array<[string, number]>;
  };
}) {
  const max = Math.max(1, ...entry.rightCounts.map(([, count]) => count));
  return (
    <article style={relationshipCardStyle}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) auto",
          gap: 10,
          alignItems: "baseline",
        }}
      >
        <strong style={relationshipCardTitleStyle} title={entry.leftValue}>
          {humanise(entry.leftValue)}
        </strong>
        <span style={relationshipCardCountStyle}>
          {entry.count.toLocaleString()}
        </span>
      </div>
      <div style={{ display: "grid", gap: 7, marginTop: 12 }}>
        {entry.rightCounts.slice(0, 4).map(([label, count]) => (
          <div key={label}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0,1fr) 34px",
                gap: 8,
                alignItems: "baseline",
              }}
            >
              <span style={relationshipSubLabelStyle} title={label}>
                {humanise(label)}
              </span>
              <span style={relationshipSubCountStyle}>
                {count.toLocaleString()}
              </span>
            </div>
            <span style={distributionTrackStyle}>
              <span
                style={{
                  ...distributionFillStyle,
                  width: `${Math.max(7, (count / max) * 100)}%`,
                }}
              />
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={summaryRowStyle}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function relationshipPairsFor(objectType: TechObjectType, rows: RecordRow[]) {
  const candidates: Record<
    TechObjectType,
    Array<{
      key: string;
      title: string;
      caption: string;
      left: string;
      right: string;
    }>
  > = {
    // Each pairing is a question someone actually asks of this record type, not every column
    // against every other. A crossing nobody would ask for is noise with a title on it.
    metric_outcome: [
      {
        key: "readiness-function",
        title: "Claim readiness by function",
        caption:
          "Which parts of the business can prove value and which cannot.",
        left: "businessFunction",
        right: "claimReadiness",
      },
      {
        key: "blocked-owner",
        title: "Blocked claims by owner",
        caption: "Who holds the unblock actions that are not yet done.",
        left: "owner",
        right: "claimReadiness",
      },
    ],
    risk_control: [
      {
        key: "severity-control",
        title: "Severity against control state",
        caption:
          "Where the register records a serious risk and no operating control.",
        left: "severity",
        right: "controlStatus",
      },
      {
        key: "domain-severity",
        title: "Risk domain by severity",
        caption: "Which kinds of risk carry the weight.",
        left: "riskDomain",
        right: "severity",
      },
    ],
    program_initiative: [
      {
        key: "status-sponsor",
        title: "Status by sponsor",
        caption: "Whose portfolio is moving and whose is not.",
        left: "businessSponsor",
        right: "status",
      },
      {
        key: "gate-status",
        title: "Stage gate against status",
        caption: "Whether reported status and gate position agree.",
        left: "stageGate",
        right: "status",
      },
    ],
    organization_ownership: [
      {
        key: "level-function",
        title: "Decision level by function",
        caption: "Where authority sits across the operating model.",
        left: "roleLevel",
        right: "ownedFunctions",
      },
    ],
    ai_use_case: [
      {
        key: "segment-status",
        title: "Use cases by segment and status",
        caption: "Where AI work is running and where it is still an idea.",
        left: "businessSegment",
        right: "currentStatus",
      },
      {
        key: "pattern-value",
        title: "Pattern against value claim",
        caption: "Which kinds of AI have produced provable value.",
        left: "aiPattern",
        right: "valueClaimStatus",
      },
    ],
    application_system: [
      {
        key: "function-vendor",
        title: "Functions mapped to vendors",
        caption: "Which third parties sit under each business capability.",
        left: "businessFunction",
        right: "vendor",
      },
      {
        key: "function-hosting",
        title: "Functions mapped to hosting",
        caption:
          "Where capability support is deployed: SaaS, cloud, on-prem, or hybrid.",
        left: "businessFunction",
        right: "deploymentModel",
      },
      {
        key: "owner-lifecycle",
        title: "Owners mapped to lifecycle",
        caption:
          "Where ownership intersects with legacy, current, and sunset posture.",
        left: "businessOwner",
        right: "lifecycleState",
      },
      {
        key: "vendor-criticality",
        title: "Vendors mapped to criticality",
        caption:
          "Which vendors support the most critical systems in the selected slice.",
        left: "vendor",
        right: "criticality",
      },
      {
        key: "domain-function",
        title: "Data domains mapped to functions",
        caption: "How data domains cluster around business capabilities.",
        left: "dataDomains",
        right: "businessFunction",
      },
    ],
    data_asset_or_integration: [
      {
        key: "kind-mechanism",
        title: "Record kinds mapped to mechanisms",
        caption:
          "Separates movement rows from data, BI, ETL, report, script, and analytics workload segments.",
        left: "recordKind",
        right: "integrationType",
      },
      {
        key: "function-workload",
        title: "Functions mapped to workload types",
        caption:
          "Which business functions carry report, ETL, script, and analytics volume.",
        left: "ownerFunction",
        right: "workloadType",
      },
      {
        key: "technology-workload",
        title: "Technologies mapped to workloads",
        caption:
          "Which reporting, analytics, and ETL tools carry each workload type.",
        left: "technologyName",
        right: "workloadType",
      },
      {
        key: "source-target",
        title: "Sources mapped to targets",
        caption: "The recorded system-to-system movement shape.",
        left: "sourceSystem",
        right: "targetSystem",
      },
      {
        key: "domain-mechanism",
        title: "Domains mapped to mechanisms",
        caption: "Which integration patterns carry each data domain.",
        left: "dataDomain",
        right: "integrationType",
      },
      {
        key: "owner-quality",
        title: "Data owners mapped to quality",
        caption: "Where stewardship intersects with quality posture.",
        left: "dataOwner",
        right: "qualityStatus",
      },
    ],
    infrastructure_platform: [
      {
        key: "hosting-stack",
        title: "Hosting mapped to stack",
        caption:
          "How platforms distribute across hosting model and technology stack.",
        left: "hostingModel",
        right: "technologyStack",
      },
      {
        key: "owner-criticality",
        title: "Owners mapped to criticality",
        caption: "Which operational owners carry the most critical platforms.",
        left: "operationalOwner",
        right: "criticality",
      },
      {
        key: "type-lifecycle",
        title: "Platform types mapped to lifecycle",
        caption: "Where aging posture appears across infrastructure families.",
        left: "platformType",
        right: "lifecycleState",
      },
    ],
    vendor_contract: [
      {
        key: "vendor-functions",
        title: "Vendors mapped to functions",
        caption: "Which functions are supported by each supplier relationship.",
        left: "vendorName",
        right: "supportedFunctions",
      },
      {
        key: "owner-risk",
        title: "Contract owners mapped to risk",
        caption: "Where commercial ownership intersects with risk rating.",
        left: "contractOwner",
        right: "riskRating",
      },
      {
        key: "service-commercial",
        title: "Services mapped to commercial model",
        caption: "How service families map to spend model and terms.",
        left: "serviceCategory",
        right: "commercialModel",
      },
    ],
  };
  return candidates[objectType].filter((pair) =>
    rows.some(
      (row) =>
        bucket(row[pair.left]) !== "(not specified)" &&
        bucket(row[pair.right]) !== "(not specified)",
    ),
  );
}

function buildRelationshipMatrix(
  rows: RecordRow[],
  leftField: string,
  rightField: string,
) {
  const byLeft = new Map<string, Map<string, number>>();
  for (const row of rows) {
    const leftValues = splitMultiValue(row[leftField]);
    const rightValues = splitMultiValue(row[rightField]);
    for (const left of leftValues) {
      if (!byLeft.has(left)) byLeft.set(left, new Map());
      const target = byLeft.get(left)!;
      for (const right of rightValues)
        target.set(right, (target.get(right) ?? 0) + 1);
    }
  }
  return [...byLeft.entries()]
    .map(([leftValue, rightMap]) => ({
      leftValue,
      count: [...rightMap.values()].reduce((sum, count) => sum + count, 0),
      rightCounts: [...rightMap.entries()].sort(
        (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
      ),
    }))
    .sort(
      (a, b) => b.count - a.count || a.leftValue.localeCompare(b.leftValue),
    );
}

function splitMultiValue(value: unknown): string[] {
  const text = bucket(value);
  if (text === "(not specified)") return [];
  return text
    .split(/[;,|]/)
    .map((item) => item.trim())
    .filter(Boolean);
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
  const fields = (DETAIL_FIELDS[recordType] ?? Object.keys(row)).filter(
    (field) => field in row,
  );
  const title = titleForSelected(recordType, row);
  return (
    <section style={selectedStyle}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <span style={eyebrow(V4.blue)}>Selected record</span>
        <span style={{ fontFamily: MONO, fontSize: 11, color: V4.slate }}>
          #{ordinal.toLocaleString()}
        </span>
      </div>
      <h2 style={selectedTitleStyle}>{title}</h2>
      <div style={selectedMetaStyle}>
        {fieldCount.toLocaleString()} fields in the source record
      </div>
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
    const tone = PILL_TONE[String(value ?? "").toLowerCase()] ?? {
      bg: V4.cream,
      fg: V4.slate,
    };
    return (
      <span style={{ ...pillStyle, background: tone.bg, color: tone.fg }}>
        {text}
      </span>
    );
  }
  // Column values are stored the way the record stores them; they are read the way a person reads.
  const formatted = formatByField(column.key, value);
  return <>{typeof formatted === "string" ? cellText(formatted) : formatted}</>;
}

function headlineFor(objectType: TechObjectType, count: number): string {
  if (objectType === "application_system")
    return `${count.toLocaleString()} applications, grouped by the way the estate actually runs.`;
  if (objectType === "vendor_contract")
    return `${count.toLocaleString()} contracts, with spend, renewal and risk visible together.`;
  if (objectType === "infrastructure_platform")
    return `${count.toLocaleString()} platforms, from data centers to managed services.`;
  if (objectType === "data_asset_or_integration")
    return `${count.toLocaleString()} data movements, assets, and data/BI/ETL workload segments.`;
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
  return String(
    row.originalRowId ??
      row.systemId ??
      row.vendorId ??
      row.infrastructureId ??
      row.dataAssetId ??
      `${titleForSelected("application_system", row)}-${index}`,
  );
}

function bucket(value: unknown): string {
  if (value === null || value === undefined || value === "")
    return "(not specified)";
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

function isTierOne(value: unknown): boolean {
  const normalized = String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return ["p0", "critical", "missioncritical", "tier1", "tier01"].includes(
    normalized,
  );
}

function moneyShort(value: number): string {
  if (!value) return "—";
  if (Math.abs(value) >= 1_000_000_000)
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(value) >= 1_000_000)
    return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function formatByField(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (/annual.*(cost|spend)|exitCost/i.test(field))
    return moneyShort(numeric(value));
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

const cubeFrameStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(240px,0.42fr) minmax(0,0.58fr)",
  gap: 18,
  marginTop: 24,
  border: `1px solid ${V4.rule}`,
  borderTop: `5px solid ${V4.green}`,
  borderRadius: 10,
  background:
    "linear-gradient(120deg,rgba(255,255,255,0.95),rgba(245,241,235,0.72))",
  padding: "18px 18px 16px",
  boxShadow: "0 14px 32px rgba(12,26,58,0.045)",
};

const cubeTitleStyle: CSSProperties = {
  margin: "8px 0 0",
  fontFamily: SERIF,
  fontSize: "clamp(21px,1.8vw,28px)",
  lineHeight: 1.15,
  letterSpacing: "-0.026em",
  fontWeight: 500,
  color: V4.ink,
};

const cubeTextStyle: CSSProperties = {
  margin: "10px 0 0",
  fontFamily: SANS,
  fontSize: 13.8,
  lineHeight: 1.55,
  color: V4.slate,
  maxWidth: "54ch",
};

const cubeControlsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
  gap: 10,
  minWidth: 0,
};

const selectLabelStyle: CSSProperties = {
  display: "grid",
  gap: 6,
  minWidth: 0,
  fontFamily: MONO,
  fontSize: 10.5,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: V4.slate,
};

const cubeSelectStyle: CSSProperties = {
  minWidth: 0,
  width: "100%",
  border: `1px solid ${V4.ruleStrong}`,
  borderRadius: 7,
  background: V4.surface,
  color: V4.ink,
  fontFamily: SANS,
  fontSize: 13,
  letterSpacing: 0,
  textTransform: "none",
  padding: "9px 10px",
};

const distributionStyle: CSSProperties = {
  gridColumn: "1 / -1",
  borderTop: `1px solid ${V4.rule}`,
  paddingTop: 14,
};

const distributionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,150px),1fr))",
  gap: 8,
  marginTop: 10,
};

const distributionButtonStyle: CSSProperties = {
  minWidth: 0,
  border: "1px solid",
  borderRadius: 8,
  background: V4.surface,
  padding: "9px 10px",
  textAlign: "left",
  cursor: "pointer",
};

const distributionLabelStyle: CSSProperties = {
  display: "block",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontFamily: SANS,
  fontSize: 12.2,
  color: V4.inkSoft,
};

const distributionTrackStyle: CSSProperties = {
  display: "block",
  height: 4,
  background: V4.cream,
  borderRadius: 99,
  overflow: "hidden",
  marginTop: 7,
};

const distributionFillStyle: CSSProperties = {
  display: "block",
  height: "100%",
  borderRadius: 99,
  background: V4.blue,
};

const distributionCountStyle: CSSProperties = {
  display: "block",
  marginTop: 6,
  fontFamily: MONO,
  fontSize: 11,
  color: V4.slate,
};

const relationshipLensStyle: CSSProperties = {
  marginTop: 18,
  border: `1px solid ${V4.rule}`,
  borderRadius: 10,
  background: "rgba(255,255,255,0.78)",
  padding: "18px 18px 20px",
};

const relationshipHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1fr) auto",
  gap: 18,
  alignItems: "start",
};

const relationshipTitleStyle: CSSProperties = {
  margin: "8px 0 0",
  fontFamily: SERIF,
  fontSize: "clamp(21px,1.7vw,27px)",
  fontWeight: 500,
  lineHeight: 1.16,
  letterSpacing: "-0.026em",
  color: V4.ink,
};

const relationshipTextStyle: CSSProperties = {
  margin: "8px 0 0",
  fontFamily: SANS,
  fontSize: 13.5,
  lineHeight: 1.52,
  color: V4.slate,
};

const relationshipGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,230px),1fr))",
  gap: 10,
  marginTop: 16,
};

const relationshipCardStyle: CSSProperties = {
  minWidth: 0,
  border: `1px solid ${V4.rule}`,
  borderTop: `4px solid ${V4.blue}`,
  borderRadius: 8,
  background: V4.surface,
  padding: "13px 14px 14px",
  boxShadow: "0 10px 24px rgba(12,26,58,0.04)",
};

const relationshipCardTitleStyle: CSSProperties = {
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontFamily: SANS,
  fontSize: 13.5,
  lineHeight: 1.25,
  color: V4.ink,
};

const relationshipCardCountStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: 12,
  color: V4.blue,
};

const relationshipSubLabelStyle: CSSProperties = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontFamily: SANS,
  fontSize: 12,
  color: V4.inkSoft,
};

const relationshipSubCountStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: 10.5,
  color: V4.slate,
  textAlign: "right",
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

const sliceSummaryStyle: CSSProperties = {
  border: `1px solid ${V4.rule}`,
  borderTop: `4px solid ${V4.green}`,
  borderRadius: 10,
  background: V4.surface,
  padding: "15px 17px 17px",
  boxShadow: "0 14px 32px rgba(12,26,58,0.045)",
};

const sliceSummaryValueStyle: CSSProperties = {
  display: "block",
  marginTop: 10,
  fontFamily: SERIF,
  fontSize: 34,
  lineHeight: 1,
  letterSpacing: "-0.035em",
  color: V4.ink,
};

const sliceSummaryLabelStyle: CSSProperties = {
  display: "block",
  marginTop: 5,
  fontFamily: MONO,
  fontSize: 10.5,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  color: V4.slate,
};

const sliceRuleStyle: CSSProperties = {
  height: 1,
  background: V4.rule,
  margin: "14px 0",
};

const summaryRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,0.44fr) minmax(0,0.56fr)",
  gap: 10,
  padding: "7px 0",
  borderBottom: `1px solid ${V4.ruleSoft}`,
  fontFamily: SANS,
  fontSize: 12.5,
  lineHeight: 1.35,
  color: V4.slate,
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
