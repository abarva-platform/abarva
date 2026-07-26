"use client";

import { useMemo, useState } from "react";

import { COLORS } from "@/components/home/HomeEnterpriseBriefApp";
import type { HomeV4ApplicationFullRow } from "./homeV4Visual";

type SortKey = "name" | "criticality" | "annual_run_cost_usd" | "named_users";

const NOT_CAPTURED = "Not captured";

function distinctValues(rows: HomeV4ApplicationFullRow[], key: keyof HomeV4ApplicationFullRow) {
  const values = new Set<string>();
  for (const row of rows) {
    const value = row[key];
    if (typeof value === "string" && value) values.add(value);
  }
  return Array.from(values).sort();
}

function countBy(rows: HomeV4ApplicationFullRow[], key: keyof HomeV4ApplicationFullRow): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = row[key];
    if (typeof value !== "string" || !value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
}

// A real portfolio-level summary computed from the same full_rows already
// loaded for the grid below -- no new data plumbing, no invented
// categories (e.g. no fabricated "cloud vs on-prem" bucketing over hosting
// values that don't cleanly split that way; real hosting values are shown
// as-is). Every number states its own real coverage rather than silently
// treating a missing field as zero.
function HomeV4ApplicationsPortfolioSummary({ rows }: { rows: HomeV4ApplicationFullRow[] }) {
  const withCost = rows.filter((row) => row.annual_run_cost_usd != null);
  const totalCost = withCost.reduce((sum, row) => sum + (row.annual_run_cost_usd ?? 0), 0);
  const owned = rows.filter((row) => row.owner).length;
  const criticalityMix = countBy(rows, "criticality");
  const hostingMix = countBy(rows, "hosting");

  return (
    <div className="heb-v4-appgrid-summary">
      <div className="heb-v4-appgrid-stat">
        <span className="heb-v4-appgrid-stat-value">{rows.length.toLocaleString()}</span>
        <span className="heb-v4-appgrid-stat-label">Applications in inventory</span>
      </div>
      <div className="heb-v4-appgrid-stat">
        <span className="heb-v4-appgrid-stat-value">
          {withCost.length > 0 ? `$${Math.round(totalCost / 1_000_000).toLocaleString()}M` : "—"}
        </span>
        <span className="heb-v4-appgrid-stat-label">
          Annual run cost{withCost.length < rows.length ? ` (${withCost.length} of ${rows.length} apps)` : ""}
        </span>
      </div>
      <div className="heb-v4-appgrid-stat">
        <span className="heb-v4-appgrid-stat-value">
          {rows.length > 0 ? `${Math.round((owned / rows.length) * 100)}%` : "—"}
        </span>
        <span className="heb-v4-appgrid-stat-label">Have a named owner on file</span>
      </div>
      <div className="heb-v4-appgrid-stat heb-v4-appgrid-stat-mix">
        <span className="heb-v4-appgrid-stat-label">By criticality</span>
        <span className="heb-v4-appgrid-stat-mix-row">
          {criticalityMix.map(([value, count]) => (
            <span key={value} className="heb-v4-appgrid-chip">
              {value} <strong>{count}</strong>
            </span>
          ))}
        </span>
      </div>
      <div className="heb-v4-appgrid-stat heb-v4-appgrid-stat-mix">
        <span className="heb-v4-appgrid-stat-label">By hosting</span>
        <span className="heb-v4-appgrid-stat-mix-row">
          {hostingMix.slice(0, 4).map(([value, count]) => (
            <span key={value} className="heb-v4-appgrid-chip">
              {value} <strong>{count}</strong>
            </span>
          ))}
          {hostingMix.length > 4 ? <span className="heb-v4-appgrid-chip-more">+{hostingMix.length - 4} more</span> : null}
        </span>
      </div>
    </div>
  );
}

export function HomeV4ApplicationsGrid({ rows }: { rows: HomeV4ApplicationFullRow[] }) {
  const [search, setSearch] = useState("");
  const [hostingFilter, setHostingFilter] = useState("");
  const [modernizationFilter, setModernizationFilter] = useState("");
  const [criticalityFilter, setCriticalityFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");

  const hostingOptions = useMemo(() => distinctValues(rows, "hosting"), [rows]);
  const modernizationOptions = useMemo(
    () => distinctValues(rows, "modernization_disposition"),
    [rows],
  );
  const criticalityOptions = useMemo(() => distinctValues(rows, "criticality"), [rows]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows
      .filter((row) => !query || row.name.toLowerCase().includes(query))
      .filter((row) => !hostingFilter || row.hosting === hostingFilter)
      .filter((row) => !modernizationFilter || row.modernization_disposition === modernizationFilter)
      .filter((row) => !criticalityFilter || row.criticality === criticalityFilter)
      .sort((a, b) => {
        if (sortKey === "name") return a.name.localeCompare(b.name);
        if (sortKey === "criticality") return (a.criticality ?? "").localeCompare(b.criticality ?? "");
        const aVal = (a[sortKey] as number | null) ?? -Infinity;
        const bVal = (b[sortKey] as number | null) ?? -Infinity;
        return bVal - aVal;
      });
  }, [rows, search, hostingFilter, modernizationFilter, criticalityFilter, sortKey]);

  const owned = rows.filter((row) => row.owner).length;
  const directCapture = rows.filter((row) => row.owner && row.owner_confidence === 1).length;
  const derivedCapture = owned - directCapture;
  const unowned = rows.length - owned;

  return (
    <div className="heb-v4-appgrid">
      <HomeV4ApplicationsPortfolioSummary rows={rows} />
      <div className="heb-v4-appgrid-head">
        <span className="heb-section-label">Full application inventory</span>
        <span className="heb-v4-appgrid-count">
          {filtered.length} of {rows.length} applications
        </span>
      </div>
      <p className="heb-v4-appgrid-gap-note">
        {owned} of {rows.length} applications have a named owner on file
        {directCapture > 0 && derivedCapture > 0
          ? ` (${directCapture} directly captured, ${derivedCapture} derived from a team/domain match — see the caveat on hover)`
          : directCapture > 0
            ? " (directly captured on the source record)"
            : derivedCapture > 0
              ? " (derived from a team/domain match, not directly captured — see the caveat on hover)"
              : ""}
        {unowned > 0 ? `. The remaining ${unowned} show “${NOT_CAPTURED}” rather than a guess.` : "."}
      </p>
      <div className="heb-v4-appgrid-controls">
        <input
          type="text"
          placeholder="Search application name…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select value={hostingFilter} onChange={(event) => setHostingFilter(event.target.value)}>
          <option value="">All hosting</option>
          {hostingOptions.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select
          value={modernizationFilter}
          onChange={(event) => setModernizationFilter(event.target.value)}
        >
          <option value="">All modernization plans</option>
          {modernizationOptions.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select
          value={criticalityFilter}
          onChange={(event) => setCriticalityFilter(event.target.value)}
        >
          <option value="">All criticality</option>
          {criticalityOptions.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}>
          <option value="name">Sort: Name</option>
          <option value="criticality">Sort: Criticality</option>
          <option value="annual_run_cost_usd">Sort: Annual run cost</option>
          <option value="named_users">Sort: Named users</option>
        </select>
      </div>
      <div className="heb-v4-appgrid-table-wrap">
        <table className="heb-v4-appgrid-table">
          <thead>
            <tr>
              <th>Application</th>
              <th>Domain</th>
              <th>Hosting</th>
              <th>Criticality</th>
              <th>Vendor</th>
              <th>Modernization</th>
              <th>Owner</th>
              <th>Sponsor</th>
              <th>Type</th>
              <th>Users</th>
              <th>Annual run cost</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.app_id}>
                <td>{row.name}</td>
                <td>{row.business_domain ?? "—"}</td>
                <td>{row.hosting ?? "—"}</td>
                <td>{row.criticality ?? "—"}</td>
                <td>{row.vendor ?? "—"}</td>
                <td>{row.modernization_disposition ?? "—"}</td>
                <td
                  className={row.owner ? undefined : "heb-v4-appgrid-gap"}
                  title={row.owner_caveat ?? undefined}
                >
                  {row.owner ?? NOT_CAPTURED}
                  {row.owner && row.owner_confidence != null && row.owner_confidence < 1 ? (
                    <span className="heb-v4-appgrid-confidence">
                      {" "}
                      ({Math.round(row.owner_confidence * 100)}%)
                    </span>
                  ) : null}
                </td>
                <td className={row.sponsor ? undefined : "heb-v4-appgrid-gap"}>
                  {row.sponsor ?? NOT_CAPTURED}
                </td>
                <td className={row.application_type ? undefined : "heb-v4-appgrid-gap"}>
                  {row.application_type ?? NOT_CAPTURED}
                </td>
                <td>{row.named_users?.toLocaleString() ?? "—"}</td>
                <td>
                  {row.annual_run_cost_usd
                    ? `$${row.annual_run_cost_usd.toLocaleString()}`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style jsx global>{`
        .heb-v4-appgrid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .heb-v4-appgrid-summary {
          display: grid;
          grid-template-columns: repeat(3, minmax(120px, 1fr)) repeat(2, minmax(200px, 1.4fr));
          gap: 10px;
          padding: 14px 16px;
          border: 1px solid ${COLORS.line};
          border-radius: 10px;
          background: ${COLORS.surface};
          margin-bottom: 4px;
        }
        .heb-v4-appgrid-stat {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }
        .heb-v4-appgrid-stat-value {
          font-family: Fraunces, Georgia, serif;
          font-size: 22px;
          color: ${COLORS.ink};
          line-height: 1.1;
        }
        .heb-v4-appgrid-stat-label {
          font-size: 10.5px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: ${COLORS.quiet};
        }
        .heb-v4-appgrid-stat-mix {
          justify-content: center;
        }
        .heb-v4-appgrid-stat-mix-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 2px;
        }
        .heb-v4-appgrid-chip {
          padding: 2px 8px;
          border-radius: 999px;
          background: ${COLORS.rail};
          font-size: 11px;
          color: ${COLORS.muted};
          white-space: nowrap;
        }
        .heb-v4-appgrid-chip strong {
          color: ${COLORS.ink};
        }
        .heb-v4-appgrid-chip-more {
          font-size: 11px;
          color: ${COLORS.quiet};
          align-self: center;
        }
        @media (max-width: 980px) {
          .heb-v4-appgrid-summary {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .heb-v4-appgrid-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
        }
        .heb-v4-appgrid-count {
          font-size: 12px;
          color: ${COLORS.quiet};
        }
        .heb-v4-appgrid-gap-note {
          margin: 0;
          font-size: 12px;
          color: ${COLORS.amber};
          max-width: 74ch;
        }
        .heb-v4-appgrid-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .heb-v4-appgrid-controls input,
        .heb-v4-appgrid-controls select {
          padding: 6px 10px;
          border: 1px solid ${COLORS.line};
          border-radius: 6px;
          background: ${COLORS.surface};
          font-size: 12.5px;
          color: ${COLORS.ink};
        }
        .heb-v4-appgrid-controls input {
          flex: 1;
          min-width: 200px;
        }
        .heb-v4-appgrid-table-wrap {
          max-height: 520px;
          overflow: auto;
          border: 1px solid ${COLORS.line};
          border-radius: 8px;
        }
        .heb-v4-appgrid-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12.5px;
        }
        .heb-v4-appgrid-table th {
          position: sticky;
          top: 0;
          background: ${COLORS.rail};
          text-align: left;
          padding: 8px 10px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: ${COLORS.muted};
          border-bottom: 1px solid ${COLORS.line};
        }
        .heb-v4-appgrid-table td {
          padding: 7px 10px;
          border-bottom: 1px solid ${COLORS.line};
          color: ${COLORS.ink};
          white-space: nowrap;
        }
        .heb-v4-appgrid-gap {
          color: ${COLORS.quiet};
          font-style: italic;
        }
        .heb-v4-appgrid-confidence {
          color: ${COLORS.amber};
          font-size: 11px;
        }
      `}</style>
    </div>
  );
}
