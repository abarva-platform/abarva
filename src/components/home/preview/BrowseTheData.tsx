"use client";

import { cellText } from "@/components/home/v4/cxo-language";
import { useMemo, useState, type CSSProperties } from "react";

import type {
  ContextItem,
  EnterpriseSignalPacket,
  Signal,
} from "@/lib/home/preview/types";
import { MONO, PAGE_X, SANS, SERIF, V4, eyebrow } from "../v4/tokens";
import { DOMAIN_ORDER, domainLabel } from "./domain-labels";

type Row =
  | (Signal & { origin: "signal" })
  | (ContextItem & {
      evidenceRefs?: undefined;
      kind?: undefined;
      origin: "context";
      value?: undefined;
    });
type IndexedRow = Row & { key: string };
type DimensionField =
  | "domain"
  | "origin"
  | "kind"
  | "evidence_state"
  | "value_state";

interface BrowserDimension {
  field: DimensionField;
  label: string;
  values: Array<[string, number]>;
}

const COLUMNS = [
  { key: "id", label: "Fact ID", width: 170, priority: "core" },
  { key: "statement", label: "Statement", width: 520, priority: "core" },
  { key: "domain", label: "Domain", width: 190 },
  { key: "kind", label: "Type", width: 130 },
  { key: "evidence_state", label: "Evidence", width: 124 },
] satisfies ReadonlyArray<{
  key: string;
  label: string;
  priority?: "core";
  width: number;
}>;

export function BrowseTheData({
  signalPacket,
}: {
  signalPacket: EnterpriseSignalPacket;
}) {
  const [query, setQuery] = useState("");
  const [sliceField, setSliceField] = useState<DimensionField>("domain");
  const [sliceValue, setSliceValue] = useState("all");
  const [diceField, setDiceField] = useState<DimensionField | "none">("kind");
  const [diceValue, setDiceValue] = useState("all");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const rows: IndexedRow[] = useMemo(
    () => [
      ...signalPacket.signals.map(
        (signal): IndexedRow => ({
          ...signal,
          key: `signal:${signal.id}`,
          origin: "signal",
        }),
      ),
      ...signalPacket.contextItems.map(
        (context): IndexedRow => ({
          ...context,
          key: `context:${context.id}`,
          origin: "context",
        }),
      ),
    ],
    [signalPacket],
  );

  const dimensions = useMemo(() => buildDimensions(rows), [rows]);
  const activeSlice =
    dimensions.find((dimension) => dimension.field === sliceField) ??
    dimensions[0];
  const diceOptions = dimensions.filter(
    (dimension) => dimension.field !== activeSlice?.field,
  );
  const activeDice =
    diceField === "none"
      ? undefined
      : dimensions.find((dimension) => dimension.field === diceField);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (
        activeSlice &&
        sliceValue !== "all" &&
        !valuesFor(row, activeSlice.field).includes(sliceValue)
      ) {
        return false;
      }
      if (
        activeDice &&
        diceValue !== "all" &&
        !valuesFor(row, activeDice.field).includes(diceValue)
      ) {
        return false;
      }
      if (!q) return true;
      return searchableText(row).includes(q);
    });
  }, [activeDice, activeSlice, diceValue, query, rows, sliceValue]);

  const selected =
    filtered.find((row) => row.key === selectedKey) ?? filtered[0] ?? rows[0];
  const visibleRows = filtered.slice(0, 120);
  const signalCount = rows.filter((row) => row.origin === "signal").length;
  const contextCount = rows.length - signalCount;
  const evidenceBacked = rows.filter(
    (row) => evidenceState(row) === "Referenced",
  ).length;
  const valuedFacts = rows.filter(
    (row) => valueState(row) === "Quantified",
  ).length;
  const sourceSummaries = signalPacket.sourceSummaries ?? [];
  const sourceRecords = sourceSummaries.reduce(
    (sum, summary) => sum + summary.recordCount,
    0,
  );
  const sourceCoverage =
    sourceSummaries.length > 0
      ? `${sourceSummaries.length.toLocaleString()} source families · ${sourceRecords.toLocaleString()} records summarized`
      : evidenceBacked > 0
        ? `${evidenceBacked.toLocaleString()} facts carry evidence refs`
        : "Source-file rollup not supplied in this packet";

  function clearFilters() {
    setQuery("");
    setSliceValue("all");
    setDiceValue("all");
  }

  return (
    <section style={{ padding: `46px ${PAGE_X}px 72px` }}>
      <style>{`
        @media (max-width: 1180px) {
          [data-browser-layout] { grid-template-columns: 1fr !important; }
          [data-browser-detail] { position: static !important; }
          [data-browser-command], [data-browser-controls], [data-browser-table-head] { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 760px) {
          [data-browser-metrics] { grid-template-columns: 1fr !important; }
          table[data-fact-table] { min-width: 0 !important; }
          table[data-fact-table] th:not([data-priority="core"]),
          table[data-fact-table] td:not([data-priority="core"]) { display: none; }
        }
      `}</style>

      <header style={{ maxWidth: 1040 }}>
        <span style={eyebrow(V4.blue)}>Browse the record</span>
        <h1 style={titleStyle}>
          Slice the governed facts behind the Home narrative
        </h1>
        <p style={ledeStyle}>
          Start with dimensions, then inspect rows. This is intentionally a
          compact browser, not an all-column dump: every visible count has a
          denominator and the selected row keeps its evidence references
          visible.
        </p>
      </header>

      <section data-browser-metrics style={metricGridStyle}>
        <Metric value={rows.length.toLocaleString()} label="facts in packet" />
        <Metric
          value={signalCount.toLocaleString()}
          label="deterministic signals"
        />
        <Metric value={contextCount.toLocaleString()} label="context facts" />
        <Metric
          value={evidenceBacked.toLocaleString()}
          label="evidence referenced"
          tone={evidenceBacked ? V4.green : V4.amber}
        />
        <Metric value={valuedFacts.toLocaleString()} label="quantified facts" />
      </section>

      <section data-browser-command style={commandStripStyle}>
        <div>
          <span style={eyebrow(V4.green)}>Slice / dice viewer</span>
          <h2 style={commandTitleStyle}>Pick a lens before reading rows.</h2>
          <p style={commandTextStyle}>
            Domains, fact type, evidence state, and value state are derived from
            the packet. Workbook source-family rollups are shown only when the
            producer supplies them.
          </p>
        </div>
        <div data-browser-controls style={controlsGridStyle}>
          <DimensionSelect
            label="Slice by"
            value={activeSlice?.field ?? "domain"}
            options={dimensions}
            onChange={(next) => {
              if (next === "none") return;
              setSliceField(next);
              setSliceValue("all");
              if (diceField === next) {
                setDiceField("none");
                setDiceValue("all");
              }
            }}
          />
          <ValueSelect
            label="Slice value"
            value={sliceValue}
            values={activeSlice?.values ?? []}
            onChange={setSliceValue}
          />
          <DimensionSelect
            includeNone
            label="Dice by"
            value={diceField}
            options={diceOptions}
            onChange={(next) => {
              setDiceField(next);
              setDiceValue("all");
            }}
          />
          <ValueSelect
            disabled={diceField === "none"}
            label="Dice value"
            value={diceValue}
            values={activeDice?.values ?? []}
            onChange={setDiceValue}
          />
        </div>
        {activeSlice ? (
          <DistributionStrip
            activeValue={sliceValue}
            title={activeSlice.label}
            values={activeSlice.values}
            onSelect={setSliceValue}
          />
        ) : null}
        {sourceSummaries.length > 0 ? (
          <SourceFamilyStrip sourceSummaries={sourceSummaries} />
        ) : null}
      </section>

      <div data-browser-layout style={layoutStyle}>
        <section style={{ minWidth: 0 }}>
          <div data-browser-table-head style={tableHeaderStyle}>
            <div>
              <span style={eyebrow(V4.slate)}>Matched rows</span>
              <div style={tableSubheadStyle}>
                {filtered.length.toLocaleString()} of{" "}
                {rows.length.toLocaleString()} facts shown
              </div>
            </div>
            <div style={searchWrapStyle}>
              <input
                aria-label="Search facts"
                placeholder="Search facts, IDs, domains, or evidence refs"
                style={searchStyle}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              {query || sliceValue !== "all" || diceValue !== "all" ? (
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

          <div style={tableShellStyle}>
            <table data-fact-table style={tableStyle}>
              <thead>
                <tr>
                  {COLUMNS.map((column) => (
                    <th
                      key={column.key}
                      data-priority={column.priority}
                      style={{ ...headerCellStyle, width: column.width }}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr
                    key={row.key}
                    onClick={() => setSelectedKey(row.key)}
                    style={{
                      background:
                        selected?.key === row.key
                          ? "rgba(0,102,204,0.055)"
                          : V4.surface,
                      cursor: "pointer",
                    }}
                  >
                    <td
                      data-priority="core"
                      style={{
                        ...bodyCellStyle,
                        color: V4.blue,
                        fontFamily: MONO,
                      }}
                    >
                      {row.id}
                    </td>
                    <td data-priority="core" style={bodyCellStyle}>
                      {cellText(row.statement)}
                    </td>
                    <td style={bodyCellStyle}>
                      {valuesFor(row, "domain").map(domainLabel).join(", ")}
                    </td>
                    <td style={bodyCellStyle}>
                      {humanise(valuesFor(row, "kind")[0])}
                    </td>
                    <td style={bodyCellStyle}>
                      <StatusPill value={evidenceState(row)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 ? (
              <p style={emptyStyle}>No facts match the current filters.</p>
            ) : null}
          </div>
          <p style={footnoteStyle}>
            Showing {visibleRows.length.toLocaleString()} of{" "}
            {filtered.length.toLocaleString()} matched rows
            {filtered.length > visibleRows.length ? " - first page only" : ""}.
          </p>
        </section>

        <aside data-browser-detail style={detailPaneStyle}>
          <section style={sliceSummaryStyle}>
            <span style={eyebrow(V4.green)}>Current slice</span>
            <strong style={sliceSummaryValueStyle}>
              {filtered.length.toLocaleString()}
            </strong>
            <span style={sliceSummaryLabelStyle}>
              of {rows.length.toLocaleString()} facts
            </span>
            <div style={sliceRuleStyle} />
            <SummaryRow
              label={activeSlice?.label ?? "Slice"}
              value={
                sliceValue === "all"
                  ? "All values"
                  : displayValue(sliceValue, activeSlice?.field)
              }
            />
            <SummaryRow
              label={activeDice?.label ?? "Dice"}
              value={
                !activeDice || diceValue === "all"
                  ? "All values"
                  : displayValue(diceValue, activeDice.field)
              }
            />
            <SummaryRow label="Source rollup" value={sourceCoverage} />
          </section>

          {selected ? (
            <section style={detailStyle}>
              <span
                style={eyebrow(
                  selected.origin === "signal" ? V4.blue : V4.green,
                )}
              >
                {selected.origin === "signal"
                  ? "Selected signal"
                  : "Selected context fact"}
              </span>
              <h2 style={detailTitleStyle}>{selected.id}</h2>
              <p style={detailStatementStyle}>{cellText(selected.statement)}</p>
              <div style={detailMetaGridStyle}>
                <Detail
                  label="Type"
                  value={
                    selected.origin === "signal"
                      ? humanise(selected.kind)
                      : "Context fact"
                  }
                />
                <Detail
                  label="Domains"
                  value={selected.domains.map(domainLabel).join(", ")}
                />
                <Detail label="Evidence" value={evidenceState(selected)} />
                <Detail label="Value state" value={valueState(selected)} />
              </div>
              <div style={sourceBoxStyle}>
                <span style={eyebrow(V4.slate)}>Evidence references</span>
                {selected.evidenceRefs?.length ? (
                  <ul style={evidenceListStyle}>
                    {selected.evidenceRefs.slice(0, 8).map((ref) => (
                      <li key={ref}>{ref}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={missingSourceStyle}>
                    No row-level evidence reference was supplied in this packet.
                    Do not treat this as source-file proof.
                  </p>
                )}
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

function SourceFamilyStrip({
  sourceSummaries,
}: {
  sourceSummaries: EnterpriseSignalPacket["sourceSummaries"];
}) {
  const shown = sourceSummaries.slice(0, 6);
  const totalRecords = sourceSummaries.reduce(
    (sum, summary) => sum + summary.recordCount,
    0,
  );
  return (
    <section style={sourceFamilyStyle} aria-label="Source family coverage">
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <span style={eyebrow(V4.green)}>Source family coverage</span>
        <span style={{ color: V4.slate, fontFamily: MONO, fontSize: 11 }}>
          {sourceSummaries.length.toLocaleString()} families ·{" "}
          {totalRecords.toLocaleString()} records
        </span>
      </div>
      <div style={sourceFamilyGridStyle}>
        {shown.map((summary) => (
          <article key={summary.sourcePath} style={sourceFamilyCardStyle}>
            <span style={sourceFamilyPathStyle}>{summary.sourcePath}</span>
            <strong style={sourceFamilyCountStyle}>
              {summary.recordCount.toLocaleString()}
            </strong>
            <span style={sourceFamilyLabelStyle}>
              {summary.objectTypes.map(humanise).join(", ")}
            </span>
            <span style={sourceFamilyBasisStyle}>
              {summary.sourceKind
                ? humanise(summary.sourceKind)
                : "source context"}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}

function buildDimensions(rows: IndexedRow[]): BrowserDimension[] {
  const fields: Array<{ field: DimensionField; label: string }> = [
    { field: "domain", label: "Domain" },
    { field: "origin", label: "Fact family" },
    { field: "kind", label: "Signal type" },
    { field: "evidence_state", label: "Evidence state" },
    { field: "value_state", label: "Value state" },
  ];
  return fields
    .map((field) => ({ ...field, values: countsFor(rows, field.field) }))
    .filter((dimension) => dimension.values.length > 1);
}

function countsFor(
  rows: IndexedRow[],
  field: DimensionField,
): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const value of valuesFor(row, field)) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort(
    (a, b) =>
      b[1] - a[1] ||
      displayValue(a[0], field).localeCompare(displayValue(b[0], field)),
  );
}

function valuesFor(row: IndexedRow, field: DimensionField): string[] {
  if (field === "domain")
    return row.domains.length ? row.domains : ["not_specified"];
  if (field === "origin")
    return [
      row.origin === "signal" ? "deterministic_signal" : "governed_context",
    ];
  if (field === "kind")
    return [row.origin === "signal" ? row.kind : "context_fact"];
  if (field === "evidence_state")
    return [evidenceState(row).toLowerCase().replace(/\s+/g, "_")];
  return [valueState(row).toLowerCase().replace(/\s+/g, "_")];
}

function searchableText(row: IndexedRow): string {
  return [
    row.id,
    row.statement,
    row.origin,
    row.origin === "signal" ? row.kind : "context fact",
    ...row.domains.map(domainLabel),
    ...(row.evidenceRefs ?? []),
  ]
    .join(" ")
    .toLowerCase();
}

function evidenceState(row: IndexedRow): "Referenced" | "Not referenced" {
  return row.evidenceRefs?.length ? "Referenced" : "Not referenced";
}

function valueState(row: IndexedRow): "Quantified" | "Text only" {
  return typeof row.value === "number" && Number.isFinite(row.value)
    ? "Quantified"
    : "Text only";
}

function displayValue(value: string, field?: DimensionField): string {
  if (field === "domain") return domainLabel(value);
  return humanise(value);
}

function humanise(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  return String(value).replace(/_/g, " ");
}

function DimensionSelect({
  label,
  value,
  options,
  includeNone,
  onChange,
}: {
  includeNone?: boolean;
  label: string;
  value: DimensionField | "none";
  options: BrowserDimension[];
  onChange: (value: DimensionField | "none") => void;
}) {
  return (
    <label style={selectLabelStyle}>
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value as DimensionField | "none")
        }
        style={selectStyle}
      >
        {includeNone ? <option value="none">No second dimension</option> : null}
        {options.map((option) => (
          <option key={option.field} value={option.field}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ValueSelect({
  label,
  value,
  values,
  disabled,
  onChange,
}: {
  disabled?: boolean;
  label: string;
  value: string;
  values: Array<[string, number]>;
  onChange: (value: string) => void;
}) {
  return (
    <label style={selectLabelStyle}>
      <span>{label}</span>
      <select
        value={disabled ? "all" : value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        style={selectStyle}
      >
        <option value="all">All values</option>
        {values.map(([option, count]) => (
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
  values,
  activeValue,
  onSelect,
}: {
  activeValue: string;
  title: string;
  values: Array<[string, number]>;
  onSelect: (value: string) => void;
}) {
  const shown = values.slice(0, 8);
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
        <span style={{ color: V4.slate, fontFamily: MONO, fontSize: 11 }}>
          {values.length.toLocaleString()} values
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

function Metric({
  value,
  label,
  tone = V4.ink,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div style={metricStyle}>
      <span style={{ ...metricValueStyle, color: tone }}>{value}</span>
      <span style={metricLabelStyle}>{label}</span>
    </div>
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div style={detailItemStyle}>
      <span style={detailLabelStyle}>{label}</span>
      <span style={detailValueStyle}>{value}</span>
    </div>
  );
}

function StatusPill({ value }: { value: string }) {
  const tone =
    value === "Referenced"
      ? { bg: "#e1f5ee", fg: "#0f6e56" }
      : { bg: "#faeeda", fg: V4.amber };
  return (
    <span style={{ ...pillStyle, background: tone.bg, color: tone.fg }}>
      {value}
    </span>
  );
}

const titleStyle = {
  color: V4.ink,
  fontFamily: SERIF,
  fontSize: "clamp(30px,2.8vw,44px)",
  fontWeight: 500,
  letterSpacing: "-0.03em",
  lineHeight: 1.1,
  margin: "14px 0 0",
  maxWidth: "34ch",
  textWrap: "balance",
} satisfies CSSProperties;
const ledeStyle = {
  color: V4.slate,
  fontFamily: SANS,
  fontSize: 16,
  lineHeight: 1.62,
  margin: "18px 0 0",
  maxWidth: "68ch",
} satisfies CSSProperties;
const metricGridStyle = {
  background: V4.rule,
  border: `1px solid ${V4.rule}`,
  display: "grid",
  gap: 1,
  gridTemplateColumns: "repeat(5,minmax(0,1fr))",
  marginTop: 26,
} satisfies CSSProperties;
const metricStyle = {
  background: V4.surface,
  minWidth: 0,
  padding: "15px 16px",
} satisfies CSSProperties;
const metricValueStyle = {
  color: V4.ink,
  display: "block",
  fontFamily: SERIF,
  fontSize: 27,
  fontVariantNumeric: "tabular-nums",
  lineHeight: 1,
} satisfies CSSProperties;
const metricLabelStyle = {
  color: V4.slate,
  display: "block",
  fontFamily: MONO,
  fontSize: 10.5,
  letterSpacing: "0.08em",
  marginTop: 7,
  textTransform: "uppercase",
} satisfies CSSProperties;
const commandStripStyle = {
  alignItems: "start",
  background:
    "linear-gradient(120deg,rgba(255,255,255,0.95),rgba(245,241,235,0.72))",
  border: `1px solid ${V4.rule}`,
  borderRadius: 10,
  borderTop: `5px solid ${V4.green}`,
  display: "grid",
  gap: 18,
  gridTemplateColumns: "minmax(240px,0.42fr) minmax(0,0.58fr)",
  marginTop: 24,
  padding: 18,
} satisfies CSSProperties;
const commandTitleStyle = {
  color: V4.ink,
  fontFamily: SERIF,
  fontSize: "clamp(21px,1.8vw,28px)",
  fontWeight: 500,
  letterSpacing: "-0.026em",
  lineHeight: 1.15,
  margin: "8px 0 0",
} satisfies CSSProperties;
const commandTextStyle = {
  color: V4.slate,
  fontFamily: SANS,
  fontSize: 13.8,
  lineHeight: 1.55,
  margin: "10px 0 0",
  maxWidth: "56ch",
} satisfies CSSProperties;
const controlsGridStyle = {
  display: "grid",
  gap: 10,
  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
  minWidth: 0,
} satisfies CSSProperties;
const selectLabelStyle = {
  color: V4.slate,
  display: "grid",
  fontFamily: MONO,
  fontSize: 10.5,
  gap: 6,
  letterSpacing: "0.08em",
  minWidth: 0,
  textTransform: "uppercase",
} satisfies CSSProperties;
const selectStyle = {
  background: V4.surface,
  border: `1px solid ${V4.ruleStrong}`,
  borderRadius: 7,
  color: V4.ink,
  fontFamily: SANS,
  fontSize: 13,
  letterSpacing: 0,
  minWidth: 0,
  padding: "9px 10px",
  textTransform: "none",
  width: "100%",
} satisfies CSSProperties;
const distributionStyle = {
  borderTop: `1px solid ${V4.rule}`,
  gridColumn: "1 / -1",
  paddingTop: 14,
} satisfies CSSProperties;
const distributionGridStyle = {
  display: "grid",
  gap: 8,
  gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,150px),1fr))",
  marginTop: 10,
} satisfies CSSProperties;
const distributionButtonStyle = {
  background: V4.surface,
  border: "1px solid",
  borderRadius: 8,
  cursor: "pointer",
  minWidth: 0,
  padding: "9px 10px",
  textAlign: "left",
} satisfies CSSProperties;
const distributionLabelStyle = {
  color: V4.inkSoft,
  display: "block",
  fontFamily: SANS,
  fontSize: 12.2,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} satisfies CSSProperties;
const distributionTrackStyle = {
  background: V4.cream,
  borderRadius: 99,
  display: "block",
  height: 4,
  marginTop: 7,
  overflow: "hidden",
} satisfies CSSProperties;
const distributionFillStyle = {
  background: V4.blue,
  borderRadius: 99,
  display: "block",
  height: "100%",
} satisfies CSSProperties;
const distributionCountStyle = {
  color: V4.slate,
  display: "block",
  fontFamily: MONO,
  fontSize: 11,
  marginTop: 6,
} satisfies CSSProperties;
const sourceFamilyStyle = {
  borderTop: `1px solid ${V4.rule}`,
  gridColumn: "1 / -1",
  paddingTop: 14,
} satisfies CSSProperties;
const sourceFamilyGridStyle = {
  display: "grid",
  gap: 8,
  gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,180px),1fr))",
  marginTop: 10,
} satisfies CSSProperties;
const sourceFamilyCardStyle = {
  background: V4.surface,
  border: `1px solid ${V4.rule}`,
  borderRadius: 8,
  minWidth: 0,
  padding: "10px 11px",
} satisfies CSSProperties;
const sourceFamilyPathStyle = {
  color: V4.blue,
  display: "block",
  fontFamily: MONO,
  fontSize: 10.5,
  letterSpacing: "0.04em",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} satisfies CSSProperties;
const sourceFamilyCountStyle = {
  color: V4.ink,
  display: "block",
  fontFamily: SERIF,
  fontSize: 25,
  fontWeight: 500,
  letterSpacing: "-0.026em",
  lineHeight: 1,
  marginTop: 8,
} satisfies CSSProperties;
const sourceFamilyLabelStyle = {
  color: V4.inkSoft,
  display: "block",
  fontFamily: SANS,
  fontSize: 12.2,
  lineHeight: 1.35,
  marginTop: 5,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} satisfies CSSProperties;
const sourceFamilyBasisStyle = {
  color: V4.slate,
  display: "block",
  fontFamily: MONO,
  fontSize: 10.5,
  letterSpacing: "0.06em",
  marginTop: 7,
  textTransform: "uppercase",
} satisfies CSSProperties;
const layoutStyle = {
  alignItems: "start",
  display: "grid",
  gap: "clamp(24px,3vw,42px)",
  gridTemplateColumns: "minmax(0,1fr) minmax(310px,380px)",
  marginTop: 28,
} satisfies CSSProperties;
const tableHeaderStyle = {
  alignItems: "end",
  display: "grid",
  gap: 16,
  gridTemplateColumns: "minmax(0,1fr) minmax(280px,520px)",
  marginBottom: 12,
} satisfies CSSProperties;
const tableSubheadStyle = {
  color: V4.slate,
  fontFamily: MONO,
  fontSize: 11,
  letterSpacing: "0.06em",
  marginTop: 7,
  textTransform: "uppercase",
} satisfies CSSProperties;
const searchWrapStyle = {
  alignItems: "center",
  display: "flex",
  gap: 8,
  minWidth: 0,
} satisfies CSSProperties;
const searchStyle = {
  background: V4.surface,
  border: `1px solid ${V4.ruleStrong}`,
  borderRadius: 7,
  color: V4.ink,
  fontFamily: SANS,
  fontSize: 14,
  padding: "10px 12px",
  width: "100%",
} satisfies CSSProperties;
const clearButtonStyle = {
  background: "transparent",
  border: "none",
  color: V4.blue,
  cursor: "pointer",
  fontFamily: MONO,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
} satisfies CSSProperties;
const tableShellStyle = {
  background: V4.surface,
  border: `1px solid ${V4.rule}`,
  borderRadius: 10,
  boxShadow: "0 14px 32px rgba(12,26,58,0.055)",
  overflowX: "auto",
} satisfies CSSProperties;
const tableStyle = {
  borderCollapse: "collapse",
  minWidth: 1120,
  tableLayout: "fixed",
  width: "100%",
} satisfies CSSProperties;
const headerCellStyle = {
  background: V4.cream,
  borderBottom: `1px solid ${V4.rule}`,
  color: V4.slate,
  fontFamily: MONO,
  fontSize: 10.5,
  fontWeight: 600,
  letterSpacing: "0.08em",
  padding: "11px 12px",
  position: "sticky",
  textAlign: "left",
  textTransform: "uppercase",
  top: 0,
  zIndex: 1,
} satisfies CSSProperties;
const bodyCellStyle = {
  borderBottom: `1px solid ${V4.rule}`,
  color: V4.inkSoft,
  fontFamily: SANS,
  fontSize: 12.5,
  lineHeight: 1.35,
  overflow: "hidden",
  padding: "10px 12px",
  textOverflow: "ellipsis",
  verticalAlign: "top",
  whiteSpace: "nowrap",
} satisfies CSSProperties;
const footnoteStyle = {
  color: V4.slate,
  fontFamily: MONO,
  fontSize: 11,
  letterSpacing: "0.05em",
  margin: "12px 0 0",
} satisfies CSSProperties;
const emptyStyle = {
  color: V4.slate,
  fontFamily: SANS,
  fontSize: 13,
  margin: 0,
  padding: 18,
} satisfies CSSProperties;
const detailPaneStyle = {
  display: "grid",
  gap: 18,
  minWidth: 0,
  position: "sticky",
  top: 26,
} satisfies CSSProperties;
const sliceSummaryStyle = {
  background: V4.surface,
  border: `1px solid ${V4.rule}`,
  borderRadius: 10,
  borderTop: `4px solid ${V4.green}`,
  boxShadow: "0 14px 32px rgba(12,26,58,0.045)",
  padding: "15px 17px 17px",
} satisfies CSSProperties;
const sliceSummaryValueStyle = {
  color: V4.ink,
  display: "block",
  fontFamily: SERIF,
  fontSize: 34,
  letterSpacing: "-0.035em",
  lineHeight: 1,
  marginTop: 10,
} satisfies CSSProperties;
const sliceSummaryLabelStyle = {
  color: V4.slate,
  display: "block",
  fontFamily: MONO,
  fontSize: 10.5,
  letterSpacing: "0.07em",
  marginTop: 5,
  textTransform: "uppercase",
} satisfies CSSProperties;
const sliceRuleStyle = {
  background: V4.rule,
  height: 1,
  margin: "14px 0",
} satisfies CSSProperties;
const summaryRowStyle = {
  borderBottom: `1px solid ${V4.ruleSoft}`,
  color: V4.slate,
  display: "grid",
  fontFamily: SANS,
  fontSize: 12.5,
  gap: 10,
  gridTemplateColumns: "minmax(0,0.42fr) minmax(0,0.58fr)",
  lineHeight: 1.35,
  padding: "7px 0",
} satisfies CSSProperties;
const detailStyle = {
  background: V4.surface,
  border: `1px solid ${V4.rule}`,
  borderRadius: 10,
  borderTop: `4px solid ${V4.blue}`,
  boxShadow: "0 14px 32px rgba(12,26,58,0.055)",
  padding: "16px 17px 18px",
} satisfies CSSProperties;
const detailTitleStyle = {
  color: V4.ink,
  fontFamily: SERIF,
  fontSize: 24,
  fontWeight: 500,
  letterSpacing: "-0.024em",
  lineHeight: 1.15,
  margin: "10px 0 0",
} satisfies CSSProperties;
const detailStatementStyle = {
  color: V4.inkSoft,
  fontFamily: SANS,
  fontSize: 14,
  lineHeight: 1.54,
  margin: "12px 0 0",
} satisfies CSSProperties;
const detailMetaGridStyle = {
  display: "grid",
  gap: 10,
  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
  marginTop: 16,
} satisfies CSSProperties;
const detailItemStyle = {
  borderTop: `1px solid ${V4.rule}`,
  minWidth: 0,
  paddingTop: 8,
} satisfies CSSProperties;
const detailLabelStyle = {
  color: V4.slate,
  display: "block",
  fontFamily: MONO,
  fontSize: 10,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
} satisfies CSSProperties;
const detailValueStyle = {
  color: V4.inkSoft,
  display: "block",
  fontFamily: SANS,
  fontSize: 12.8,
  lineHeight: 1.38,
  marginTop: 4,
  overflowWrap: "anywhere",
} satisfies CSSProperties;
const sourceBoxStyle = {
  borderTop: `1px solid ${V4.rule}`,
  marginTop: 18,
  paddingTop: 14,
} satisfies CSSProperties;
const evidenceListStyle = {
  color: V4.inkSoft,
  fontFamily: SANS,
  fontSize: 12.8,
  lineHeight: 1.5,
  margin: "10px 0 0",
  paddingLeft: 18,
} satisfies CSSProperties;
const missingSourceStyle = {
  color: V4.slate,
  fontFamily: SANS,
  fontSize: 12.8,
  lineHeight: 1.5,
  margin: "10px 0 0",
} satisfies CSSProperties;
const pillStyle = {
  borderRadius: 3,
  display: "inline-block",
  fontFamily: MONO,
  fontSize: 10.8,
  fontWeight: 600,
  letterSpacing: "0.06em",
  maxWidth: "100%",
  overflow: "hidden",
  padding: "3px 7px",
  textOverflow: "ellipsis",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
} satisfies CSSProperties;
