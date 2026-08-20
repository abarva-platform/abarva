"use client";

import { useMemo, useState } from "react";

import type { TechRecordType } from "@/lib/home/preview/types";
import { MONO, PAGE_X, SANS, SERIF, V4, eyebrow } from "./tokens";

/**
 * The record browser, built to the approved v4 design.
 *
 * The point of this page is that it shows the source extract and nothing else: every column is a
 * field that exists in the file, nothing is derived, inferred or scored. That claim is only worth
 * making if the page also refuses to present a field it cannot support -- see `fieldQuality` below,
 * which is what stops a column of three repeated values from being read as 301 measurements.
 */

/** Lifecycle is the one column where a recorded value carries consequence, so it is the one column
 * that gets colour. Every other cell is text. */
const LIFECYCLE_PILL: Record<string, { bg: string; fg: string }> = {
  current: { bg: "#e1f5ee", fg: "#0f6e56" },
  legacy_stable: { bg: V4.cream, fg: V4.slate },
  sunset_planned: { bg: "#faeeda", fg: V4.amber },
  deprecated: { bg: "#fceded", fg: V4.red },
  target_state: { bg: "#e8f0fa", fg: V4.blue },
};

interface Column {
  key: string;
  label: string;
  width: number;
  align?: "right";
  /** Columns that drop first when the canvas cannot hold all seven. */
  droppable?: boolean;
  kind?: "pill" | "mono" | "muted";
}

const COLUMNS: Column[] = [
  { key: "systemName", label: "System", width: 190 },
  { key: "systemCategory", label: "Category", width: 230, kind: "muted" },
  { key: "criticality", label: "Criticality", width: 96, kind: "mono" },
  { key: "lifecycleState", label: "Lifecycle", width: 132, kind: "pill" },
  { key: "interfacesCount", label: "Interfaces", width: 88, align: "right", droppable: true, kind: "mono" },
  { key: "vendor", label: "Vendor", width: 120, droppable: true, kind: "muted" },
  { key: "annualCostUsd", label: "Annual cost", width: 92, align: "right", kind: "mono" },
];

/**
 * A field is not usable for per-record reading when it holds almost no distinct values across many
 * records. `annualCostUsd` is the live example: three distinct numbers across 301 systems. The
 * total is fine; ranking one system against another is not. Printing the number anyway would
 * invite exactly the conclusion the data cannot support, so the cell says so instead.
 *
 * Computed, not hardcoded -- if the extract improves, the column starts showing values on its own.
 */
function fieldQuality(rows: Array<Record<string, unknown>>, key: string): { usable: boolean; distinct: number } {
  const distinct = new Set(rows.map((r) => r[key]).filter((v) => v !== null && v !== undefined && v !== "")).size;
  const usable = rows.length < 20 || distinct >= Math.min(20, Math.ceil(rows.length * 0.05));
  return { usable, distinct };
}

function humanise(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value).replace(/_/g, " ");
}

function Facet({ title, counts }: { title: string; counts: Array<[string, number]> }) {
  const max = Math.max(1, ...counts.map(([, n]) => n));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <span style={eyebrow(V4.slate)}>{title}</span>
        <span style={{ fontFamily: MONO, fontSize: 11, color: V4.slate }}>{counts.length}</span>
      </div>
      {counts.slice(0, 6).map(([label, n]) => (
        <div
          key={label}
          style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 34px", gap: 7, alignItems: "center", padding: "3px 0" }}
        >
          <span
            style={{ fontFamily: SANS, fontSize: 11.5, color: V4.slate, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
            title={label}
          >
            {humanise(label)}
          </span>
          <span
            style={{ fontFamily: MONO, fontSize: 11, color: V4.slate, textAlign: "right", fontVariantNumeric: "tabular-nums" }}
          >
            {n}
          </span>
          <span style={{ gridColumn: "1/-1", height: 3, background: V4.cream, borderRadius: 2, overflow: "hidden" }}>
            <span style={{ display: "block", height: "100%", width: `${(n / max) * 100}%`, background: "rgba(12,26,58,0.55)" }} />
          </span>
        </div>
      ))}
    </div>
  );
}

export function RecordBrowser({ recordType }: { recordType: TechRecordType }) {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => recordType.rows ?? [], [recordType]);

  const stats = useMemo(() => {
    const aging = rows.filter((r) => ["legacy_stable", "sunset_planned", "deprecated"].includes(String(r.lifecycleState))).length;
    const regulated = rows.filter((r) => /phi/i.test(String(r.dataClassification)) || /hipaa/i.test(String(r.complianceScope))).length;
    const replace = rows.filter((r) => String(r.replacementCandidate) === "yes").length;
    const functions = new Set(rows.map((r) => r.businessFunction).filter(Boolean)).size;
    return [
      { n: rows.length, label: "systems recorded" },
      { n: aging, label: "legacy, sunset-planned or deprecated", tone: V4.amber },
      { n: regulated, label: "carry regulated data" },
      { n: replace, label: "flagged to replace", tone: V4.amber },
      { n: functions, label: "business functions" },
    ];
  }, [rows]);

  const facets = useMemo(() => {
    const of = (key: string) => {
      const counts = new Map<string, number>();
      for (const r of rows) {
        const v = r[key];
        if (v === null || v === undefined || v === "") continue;
        counts.set(String(v), (counts.get(String(v)) ?? 0) + 1);
      }
      return [...counts.entries()].sort((a, b) => b[1] - a[1]);
    };
    return [
      { title: "Business function", counts: of("businessFunction") },
      { title: "Lifecycle", counts: of("lifecycleState") },
      { title: "Criticality", counts: of("criticality") },
    ];
  }, [rows]);

  const costQuality = useMemo(() => fieldQuality(rows, "annualCostUsd"), [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => COLUMNS.some((c) => String(r[c.key] ?? "").toLowerCase().includes(q)));
  }, [rows, query]);

  const shown = filtered.slice(0, 60);
  const fieldCount = recordType.columns?.length ?? Object.keys(rows[0] ?? {}).length;

  return (
    <div style={{ padding: `54px ${PAGE_X}px 60px` }}>
      <style>{`
        @media (max-width: 1320px) {
          table[data-records] [data-col] { display: none; }
          table[data-records] { min-width: 0 !important; }
          [data-cue="wide"] { display: none; }
          [data-cue="narrow"] { display: inline; }
        }
        [data-cue="wide"] { display: inline; }
        [data-cue="narrow"] { display: none; }
      `}</style>

      <span style={eyebrow(V4.blue)}>The evidence · {recordType.label}</span>
      <h1
        style={{
          fontFamily: SERIF,
          fontWeight: 500,
          fontSize: "clamp(30px,2.6vw,42px)",
          lineHeight: 1.1,
          letterSpacing: "-0.028em",
          margin: "14px 0 0",
          maxWidth: "34ch",
          textWrap: "balance",
        }}
      >
        {rows.length} {rows.length === 1 ? "record" : "records"}, as the source files describe them.
      </h1>
      <p style={{ fontFamily: SANS, fontSize: 17, lineHeight: 1.62, color: V4.slate, maxWidth: "52ch", margin: "22px 0 0", textWrap: "pretty" }}>
        Every column is a field that exists in the source extract — nothing is derived, inferred or scored here.{" "}
        {fieldCount} fields are recorded per record; the {COLUMNS.length} that answer most questions are shown.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,150px),1fr))",
          gap: "8px clamp(20px,3vw,44px)",
          margin: "30px 0 0",
          padding: "4px 0",
          borderTop: `1px solid ${V4.rule}`,
          borderBottom: `1px solid ${V4.rule}`,
        }}
      >
        {stats.map((s) => (
          <div key={s.label} style={{ padding: "15px 0 14px" }}>
            <span
              style={{
                display: "block",
                fontFamily: SERIF,
                fontSize: 26,
                fontWeight: 500,
                letterSpacing: "-0.03em",
                lineHeight: 1,
                color: s.tone ?? V4.ink,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {s.n}
            </span>
            <span style={{ display: "block", marginTop: 7, fontFamily: SANS, fontSize: 11.5, color: V4.slate, maxWidth: "21ch", lineHeight: 1.4 }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,max(34rem,58%)),1fr))",
          gap: "0 clamp(20px,3vw,40px)",
          marginTop: 28,
          alignItems: "start",
        }}
      >
        <section style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${rows.length} records…`}
              style={{
                flex: 1,
                padding: "9px 12px",
                border: `1px solid ${V4.ruleStrong}`,
                borderRadius: 6,
                fontFamily: SANS,
                fontSize: 13,
                background: V4.surface,
                color: V4.ink,
              }}
            />
            <span style={{ fontFamily: MONO, fontSize: 11, color: V4.slate, whiteSpace: "nowrap" }}>
              {filtered.length} of {rows.length}
            </span>
          </div>

          <div style={{ overflowX: "auto", border: `1px solid ${V4.rule}`, borderRadius: 8, background: V4.surface }}>
            <table data-records style={{ width: "100%", minWidth: 948, tableLayout: "fixed", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr>
                  {COLUMNS.map((c) => (
                    <th
                      key={c.key}
                      {...(c.droppable ? { "data-col": c.key } : {})}
                      style={{
                        width: c.width,
                        fontFamily: MONO,
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: V4.slate,
                        textAlign: c.align ?? "left",
                        padding: "10px 12px",
                        background: V4.cream,
                        borderBottom: `1px solid ${V4.rule}`,
                      }}
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((row, i) => (
                  <tr key={`${row.systemName ?? i}-${i}`}>
                    {COLUMNS.map((c) => {
                      const raw = row[c.key];
                      const notUsable = c.key === "annualCostUsd" && !costQuality.usable;
                      const base = {
                        padding: "9px 12px",
                        borderBottom: `1px solid ${V4.rule}`,
                        textAlign: c.align ?? ("left" as const),
                      };
                      if (c.kind === "pill") {
                        const pill = LIFECYCLE_PILL[String(raw)] ?? { bg: V4.cream, fg: V4.slate };
                        return (
                          <td key={c.key} style={base}>
                            <span
                              style={{
                                display: "inline-block",
                                fontFamily: MONO,
                                fontSize: 11,
                                fontWeight: 600,
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                padding: "3px 7px",
                                borderRadius: 3,
                                whiteSpace: "nowrap",
                                background: pill.bg,
                                color: pill.fg,
                              }}
                            >
                              {humanise(raw)}
                            </span>
                          </td>
                        );
                      }
                      return (
                        <td
                          key={c.key}
                          {...(c.droppable ? { "data-col": c.key } : {})}
                          style={{
                            ...base,
                            fontFamily: c.kind === "mono" ? MONO : SANS,
                            fontSize: c.kind === "mono" ? 11.5 : 12.5,
                            fontWeight: c.key === "systemName" ? 500 : 400,
                            color: notUsable ? V4.slate : c.kind === "muted" ? V4.slate : V4.ink,
                            fontVariantNumeric: c.align === "right" ? "tabular-nums" : undefined,
                            fontStyle: notUsable ? "italic" : undefined,
                          }}
                        >
                          {notUsable ? "not usable" : humanise(raw)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ margin: "12px 0 0", fontFamily: MONO, fontSize: 11, letterSpacing: "0.06em", color: V4.slate }}>
            <span data-cue="wide">
              {shown.length} of {filtered.length} shown
            </span>
            <span data-cue="narrow">
              Interfaces and vendor are hidden at this width · scroll sideways for annual cost · {shown.length} of{" "}
              {filtered.length} shown
            </span>
            {filtered.length > shown.length ? <span style={{ color: V4.stone }}> · first {shown.length} only</span> : null}
          </p>
        </section>

        <aside style={{ display: "flex", flexDirection: "column", gap: 26, minWidth: 0 }}>
          {facets.map((f) => (
            <Facet key={f.title} title={f.title} counts={f.counts} />
          ))}

          {!costQuality.usable ? (
            <div
              style={{
                padding: "14px 16px",
                background: "rgba(186,117,23,0.06)",
                border: "1px solid rgba(186,117,23,0.35)",
                borderLeft: `2px solid ${V4.amber}`,
                borderRadius: 6,
              }}
            >
              <div style={eyebrow(V4.amber)}>Field quality</div>
              <p style={{ margin: "8px 0 0", fontFamily: SANS, fontSize: 12.5, lineHeight: 1.55, color: "#7d4e0f", maxWidth: "44ch" }}>
                <strong>Annual cost</strong> holds {costQuality.distinct} distinct{" "}
                {costQuality.distinct === 1 ? "value" : "values"} across {rows.length} records. Totals are usable;
                ranking individual records by cost is not — so the column reads{" "}
                <em style={{ fontStyle: "normal", fontWeight: 600 }}>not usable</em> rather than showing a number that
                invites a false conclusion.
              </p>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
