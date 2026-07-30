"use client";

import { useMemo, useState } from "react";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";
import { StateBadge } from "../state/StateBanner";
import { SavedViewExportBar } from "../saved-views/SavedViewExportBar";
import type { InventoryKindConfig, InventoryRecord } from "./inventory-config";
import { InventoryChart } from "./InventoryChart";

const ACCEPTED_READINESS = new Set([
  "accepted",
  "Accepted",
  "baselined",
  "Baselined",
]);

function readinessTone(
  value: InventoryCellValue,
): "neutral" | "candidate" | "gap" {
  const text = String(value ?? "").toLowerCase();
  if (ACCEPTED_READINESS.has(String(value ?? ""))) return "neutral";
  if (
    text.includes("disagree") ||
    text.includes("not assigned") ||
    text.includes("not loaded")
  )
    return "gap";
  return "candidate";
}

type InventoryCellValue = string | number | null;

export function InventoryTable({
  config,
}: {
  readonly config: InventoryKindConfig;
}) {
  const { provider, providerCtx, openDrawer } = useKnowledgeApp();
  const envelope = useEnvelope(
    () => config.fetch(provider, providerCtx),
    [provider, providerCtx, config.kind],
  );

  const [activeFacets, setActiveFacets] = useState<Record<string, string[]>>(
    {},
  );
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [chartOn, setChartOn] = useState(false);
  const [compact, setCompact] = useState(false);

  return (
    <GatedSection
      envelope={envelope}
      label={config.label}
      emptyTitle={`${config.label}: withheld pending pipeline`}
      emptyBody="This inventory has not been reconciled for airline-demo-new yet. It is withheld, not shown as an empty (zero-row) table -- an empty table here would misleadingly read as 'nothing exists'."
    >
      {(rows) => (
        <InventoryTableBody
          config={config}
          rows={rows}
          activeFacets={activeFacets}
          setActiveFacets={setActiveFacets}
          sort={sort}
          setSort={setSort}
          chartOn={chartOn}
          setChartOn={setChartOn}
          compact={compact}
          setCompact={setCompact}
          onRowClick={(row) =>
            openDrawer({
              kind: config.label,
              title: String(row[config.primaryKey] ?? "Untitled"),
              evidence: [],
              attributes: config.columns.map((c) => ({
                label: c.label,
                value: String(row[c.key] ?? "-"),
              })),
            })
          }
        />
      )}
    </GatedSection>
  );
}

function InventoryTableBody({
  config,
  rows,
  activeFacets,
  setActiveFacets,
  sort,
  setSort,
  chartOn,
  setChartOn,
  compact,
  setCompact,
  onRowClick,
}: {
  readonly config: InventoryKindConfig;
  readonly rows: readonly InventoryRecord[];
  readonly activeFacets: Record<string, string[]>;
  readonly setActiveFacets: (v: Record<string, string[]>) => void;
  readonly sort: { key: string; dir: 1 | -1 } | null;
  readonly setSort: (v: { key: string; dir: 1 | -1 } | null) => void;
  readonly chartOn: boolean;
  readonly setChartOn: (v: boolean) => void;
  readonly compact: boolean;
  readonly setCompact: (v: boolean) => void;
  readonly onRowClick: (row: InventoryRecord) => void;
}) {
  const filtered = useMemo(() => {
    let result = rows.filter((row) =>
      Object.entries(activeFacets).every(
        ([key, values]) => !values.length || values.includes(String(row[key])),
      ),
    );
    if (sort) {
      const { key, dir } = sort;
      result = [...result].sort((a, b) => {
        const av = a[key];
        const bv = b[key];
        if (typeof av === "number" && typeof bv === "number")
          return (av - bv) * dir;
        return String(av ?? "").localeCompare(String(bv ?? "")) * dir;
      });
    }
    return result;
  }, [rows, activeFacets, sort]);

  const visibleColumns = compact
    ? config.columns
        .slice(0, 3)
        .concat(config.columns[config.columns.length - 1])
    : config.columns;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[#5f5e5a]">
          {config.label} - {filtered.length} shown
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCompact(!compact)}
            className="rounded-md border border-[rgba(10,10,11,0.18)] px-2 py-1 text-xs text-[#5f5e5a]"
          >
            {compact ? "All columns" : "Fewer columns"}
          </button>
          {config.chartable ? (
            <button
              type="button"
              onClick={() => setChartOn(!chartOn)}
              className={`rounded-md border px-2 py-1 text-xs ${
                chartOn
                  ? "border-[rgba(0,102,204,0.45)] bg-[rgba(0,102,204,0.1)] text-[#0066CC]"
                  : "border-[rgba(10,10,11,0.18)] text-[#5f5e5a]"
              }`}
            >
              Chart
            </button>
          ) : null}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-4">
        {config.facets.map((facet) => {
          const options = facet.options.length
            ? facet.options
            : Array.from(
                new Set(rows.map((r) => String(r[facet.key] ?? ""))),
              ).filter(Boolean);
          if (options.length === 0) return null;
          const active = activeFacets[facet.key] ?? [];
          return (
            <div key={facet.key}>
              <p className="mb-1 text-xs font-medium text-[#888780]">
                {facet.label}
              </p>
              <div className="flex flex-wrap gap-1">
                {options.map((opt) => {
                  const isActive = active.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() =>
                        setActiveFacets({
                          ...activeFacets,
                          [facet.key]: isActive
                            ? active.filter((v) => v !== opt)
                            : [...active, opt],
                        })
                      }
                      className={`rounded-full border px-2 py-0.5 text-xs ${
                        isActive
                          ? "border-[#0c1a3a] bg-[#0c1a3a] text-white"
                          : "border-[rgba(10,10,11,0.18)] bg-white text-[#5f5e5a]"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {chartOn && config.chartable ? (
        <InventoryChart config={config} rows={filtered} />
      ) : null}

      <div className="overflow-x-auto rounded-md border border-[rgba(10,10,11,0.1)]">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[rgba(10,10,11,0.1)] bg-[rgba(10,10,11,0.02)]">
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  onClick={() =>
                    setSort({
                      key: col.key,
                      dir: sort?.key === col.key && sort.dir === 1 ? -1 : 1,
                    })
                  }
                  className={`cursor-pointer whitespace-nowrap px-3 py-2 text-xs font-medium uppercase tracking-wide text-[#888780] ${
                    col.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr
                key={i}
                onClick={() => onRowClick(row)}
                className="cursor-pointer border-b border-[rgba(10,10,11,0.06)] hover:bg-[rgba(0,102,204,0.03)]"
              >
                {visibleColumns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-3 py-2 ${col.align === "right" ? "text-right" : "text-left"}`}
                  >
                    {col.key === config.readinessKey ? (
                      <StateBadge
                        tone={readinessTone(row[col.key])}
                        label={String(row[col.key] ?? "-")}
                      />
                    ) : (
                      <span className="text-[#2c2c2a]">
                        {row[col.key] === null ? "-" : String(row[col.key])}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SavedViewExportBar
        hasRealData={rows.length > 0}
        viewLabel={config.label}
      />
    </div>
  );
}
