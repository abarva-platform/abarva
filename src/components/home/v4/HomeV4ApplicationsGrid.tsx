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
