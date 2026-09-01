"use client";

import { useState } from "react";

import {
  rankFindings,
  splitLeadingFigure,
  type Finding,
  type FindingKind,
  type TableSpec,
  type UnsupportedView,
} from "./page-tables";
import { cellText } from "./cxo-language";
import { LineageMark } from "./FactLineage";
import type { FactLineage } from "./fact-lineage";
import { MONO, PAGE_X, SANS, SERIF, V4, eyebrow } from "./tokens";

/**
 * A page's deterministic depth: its table set, then the findings the same rows produce.
 *
 * The findings header states its own count, so a block of two reads as a complete answer rather
 * than as a page missing three. Nothing here renders an empty state -- a page whose rows produce no
 * finding renders no block, and a page with no tables renders nothing at all.
 */

/** Stripe colour carries the finding's kind. Both are reserved meanings in the v4 system: amber is
 * absence, red is a rated exposure. Neither may be used for emphasis, or they stop meaning anything. */
const STRIPE: Record<FindingKind, string> = {
  exposure: V4.red,
  absence: V4.amber,
  established: V4.green,
};

const COUNT_WORD = [
  "no",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
];

/** A finding's trace, in the shape the provenance mark reads. Same contract as Tower's. */
function lineageForFinding(finding: Finding): FactLineage | null {
  if (!finding.trace) return null;
  return {
    value: finding.claim,
    label: "this finding",
    grain: finding.trace.grain,
    sources: [
      { file: finding.trace.file, rows: 0, filter: finding.trace.rule },
    ],
    agreement: "single_source",
    openRows: finding.openRows,
  };
}

/**
 * The chapter's tables, grouped into its named sections.
 *
 * Eight ungrouped tables measured ten screens with no landmarks: a reader could not say where they
 * were, what was left, or which table mattered. Grouping does not move a row -- it gives the scroll
 * a structure, and lets each section open one table at a time so the chapter is scannable before it
 * is exhaustive.
 *
 * A table set whose tables declare no section renders exactly as it did before.
 */
export function TableSet({ tables }: { tables: TableSpec[] }) {
  if (tables.length === 0) return null;
  // Grouped by name, ordered by where each name first appears. Grouping only adjacent tables would
  // split one section in two whenever its tables are not contiguous in the builder's output, and a
  // chapter showing "Where it runs" twice reads as a bug rather than as a structure.
  const sections: Array<{ name: string | null; tables: TableSpec[] }> = [];
  for (const table of tables) {
    const name = table.section ?? null;
    const existing = sections.find((section) => section.name === name);
    if (existing) existing.tables.push(table);
    else sections.push({ name, tables: [table] });
  }
  if (sections.length === 1 && sections[0].name === null) {
    return <TableGrid tables={tables} />;
  }
  return (
    <>
      {sections.map((section, index) => (
        <TableSection
          key={section.name ?? `unnamed-${index}`}
          name={section.name}
          index={index + 1}
          count={sections.length}
          tables={section.tables}
        />
      ))}
    </>
  );
}

/**
 * One named part of a chapter. The first table is open; the rest state what they hold and open on
 * request -- a collapsed table still says its own shape, so collapsing hides length, never content.
 */
function TableSection({
  name,
  index,
  count,
  tables,
}: {
  name: string | null;
  index: number;
  count: number;
  tables: TableSpec[];
}) {
  const [openCaption, setOpenCaption] = useState<string | null>(
    tables[0]?.caption ?? null,
  );
  return (
    <section
      data-home-table-section={name ?? undefined}
      id={name ? sectionId(name) : undefined}
      style={{ padding: `30px ${PAGE_X}px 0`, scrollMarginTop: 72 }}
    >
      {name ? (
        <div style={{ borderTop: `1px solid ${V4.rule}`, paddingTop: 14 }}>
          <span style={eyebrow(V4.stone)}>
            {String(index).padStart(2, "0")} of {String(count).padStart(2, "0")}
          </span>
          <h3
            style={{
              margin: "7px 0 0",
              fontFamily: SERIF,
              fontSize: 23,
              fontWeight: 500,
              lineHeight: 1.2,
            }}
          >
            {name}
          </h3>
          <p style={sectionCountStyle}>
            {tables.length === 1 ? "One table" : `${tables.length} tables`}
          </p>
        </div>
      ) : null}
      {tables.map((table) =>
        table.caption === openCaption ? (
          <TableGrid key={table.caption} tables={[table]} />
        ) : (
          <button
            key={table.caption}
            type="button"
            data-home-table-collapsed={table.caption}
            onClick={() => setOpenCaption(table.caption)}
            style={collapsedRowStyle}
          >
            <span style={{ fontFamily: SANS, fontSize: 14.5, color: V4.ink }}>
              {table.caption}
            </span>
            <span style={collapsedMetaStyle}>
              {table.rows.length} {table.rows.length === 1 ? "row" : "rows"} ·
              open
            </span>
          </button>
        ),
      )}
    </section>
  );
}

/** Stable anchor for the chapter spine. */
export function sectionId(name: string): string {
  return `section-${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

function TableGrid({ tables }: { tables: TableSpec[] }) {
  if (tables.length === 0) return null;
  return (
    <section
      data-home-table-set
      style={{
        padding: "18px 0 0",
        display: "grid",
        gridTemplateColumns:
          tables.length === 1
            ? "minmax(0, 1fr)"
            : "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
        gap: 26,
        alignItems: "start",
      }}
    >
      {tables.map((table) => {
        // The largest value in the bar column sets the scale, so a bar is a share of the biggest
        // row rather than of an invented maximum.
        const barIndex = table.barColumn
          ? table.columns.indexOf(table.barColumn)
          : -1;
        const barMax =
          barIndex === -1
            ? 0
            : Math.max(
                ...table.rows.map(
                  (row) =>
                    Number(String(row[barIndex]).replace(/[^0-9.]/g, "")) || 0,
                ),
              );
        return (
          <div
            key={table.caption}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 11,
              minWidth: 0,
              // A wide table takes the whole row so its totals column is on screen, not behind a
              // sideways scroll. The container still scrolls if the viewport is narrower than that.
              gridColumn: table.wide ? "1 / -1" : undefined,
            }}
          >
            <span style={eyebrow(V4.slate)}>{table.caption}</span>
            <div
              style={{
                background: V4.surface,
                border: `1px solid ${V4.rule}`,
                padding: "16px 18px",
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  borderCollapse: "collapse",
                  width: "100%",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <thead>
                  <tr>
                    {table.columns.map((column, i) => (
                      <th
                        key={column}
                        style={{
                          ...eyebrow(V4.slate),
                          fontSize: 10,
                          textAlign: i === 0 ? "left" : "right",
                          padding: "0 12px 7px",
                          borderBottom: `1px solid ${V4.ruleStrong}`,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, r) => (
                    <tr key={r}>
                      {row.map((cell, i) => (
                        <td
                          key={i}
                          style={{
                            fontFamily: i === 0 ? SANS : MONO,
                            fontSize: i === 0 ? 13.5 : 12.5,
                            color: i === 0 ? V4.ink : V4.inkSoft,
                            textAlign: i === 0 ? "left" : "right",
                            padding: "7px 12px",
                            borderBottom: `1px solid ${V4.ruleSoft}`,
                            whiteSpace: i === 0 ? "normal" : "nowrap",
                            position: "relative",
                          }}
                        >
                          {i === barIndex && barMax > 0 ? (
                            <span
                              aria-hidden="true"
                              data-home-table-bar
                              style={{
                                position: "absolute",
                                right: 0,
                                top: 4,
                                bottom: 4,
                                width: `${Math.round((100 * (Number(String(cell).replace(/[^0-9.]/g, "")) || 0)) / barMax)}%`,
                                background: "rgba(12,26,58,0.09)",
                                pointerEvents: "none",
                              }}
                            />
                          ) : null}
                          <span style={{ position: "relative" }}>
                            {cellText(cell)}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                  {table.total ? (
                    <tr>
                      {table.total.map((cell, i) => (
                        <td
                          key={i}
                          style={{
                            fontFamily: i === 0 ? SANS : MONO,
                            fontSize: i === 0 ? 13.5 : 12.5,
                            fontWeight: 600,
                            color: V4.ink,
                            textAlign: i === 0 ? "left" : "right",
                            padding: "7px 12px",
                            borderTop: `1px solid ${V4.ruleStrong}`,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {cellText(cell)}
                        </td>
                      ))}
                    </tr>
                  ) : null}
                </tbody>
              </table>
              {table.note ? (
                <p
                  style={{
                    margin: "12px 0 0",
                    fontFamily: SANS,
                    fontSize: 12.5,
                    lineHeight: 1.5,
                    color: V4.slate,
                  }}
                >
                  {table.note}
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </section>
  );
}

const sectionCountStyle = {
  margin: "6px 0 0",
  fontFamily: MONO,
  fontSize: 11,
  letterSpacing: "0.06em",
  color: V4.slate,
} as const;

const collapsedRowStyle = {
  display: "flex",
  width: "100%",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: 16,
  marginTop: 10,
  padding: "13px 16px",
  background: V4.surface,
  border: `1px solid ${V4.rule}`,
  borderRadius: 3,
  cursor: "pointer",
  textAlign: "left" as const,
};

const collapsedMetaStyle = {
  fontFamily: MONO,
  fontSize: 11,
  letterSpacing: "0.05em",
  color: V4.slate,
  whiteSpace: "nowrap" as const,
} as const;

export function FindingsBlock({
  findings,
  onOpenRows,
}: {
  findings: Finding[];
  /** Opens the rows behind a finding. Absent, the mark still explains; it just cannot navigate. */
  onOpenRows?: (objectType: string, filter: string) => void;
}) {
  // No findings, no block. The alternative -- a heading over an apology -- is the failure this
  // design exists to remove, and an empty state is how it creeps back in.
  if (findings.length === 0) return null;
  const count = COUNT_WORD[findings.length] ?? String(findings.length);
  // Exposure, then absence, then established -- descending order of what a reader has to act on.
  const ranked = rankFindings(findings);
  const exposures = ranked.filter(
    (finding) => finding.kind === "exposure",
  ).length;
  return (
    <section
      data-home-findings
      style={{
        padding: `34px ${PAGE_X}px 0`,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 11,
          flexWrap: "wrap",
        }}
      >
        <span
          style={eyebrow(V4.slate)}
          data-home-findings-count={findings.length}
        >
          What does not reconcile — {count} today
        </span>
        {exposures > 0 ? (
          <span
            style={{ ...eyebrow(V4.red), fontSize: 10 }}
            data-home-findings-exposures={exposures}
          >
            {exposures} the record says {exposures === 1 ? "is" : "are"} wrong
            now
          </span>
        ) : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {ranked.map((finding, position) => (
          <div
            key={finding.claim}
            data-home-finding={finding.kind}
            style={{
              background: V4.surface,
              border: `1px solid ${V4.rule}`,
              boxShadow: `inset 3px 0 0 ${STRIPE[finding.kind]}`,
              padding: "16px 20px",
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto",
              gap: "6px 24px",
              alignItems: "start",
            }}
          >
            <div
              style={{
                fontFamily: SANS,
                // The leading finding carries more room: a block sorted by consequence should look
                // sorted, not merely be sorted.
                fontSize: position === 0 ? 16.5 : 15,
                lineHeight: 1.45,
                maxWidth: "68ch",
              }}
            >
              {(() => {
                const lineage = lineageForFinding(finding);
                // A finding a reader cannot reproduce is an assertion, and an assertion carrying an
                // owner's name is worse than none -- so the rule that produced it travels with it.
                const split = splitLeadingFigure(finding.claim);
                const body = split ? (
                  <>
                    <span
                      style={{
                        fontFamily: SERIF,
                        fontSize: position === 0 ? 26 : 21,
                        lineHeight: 1,
                        fontVariantNumeric: "tabular-nums",
                        marginRight: 7,
                      }}
                    >
                      {split.figure}
                    </span>
                    {split.rest}
                  </>
                ) : (
                  finding.claim
                );
                return lineage ? (
                  <LineageMark lineage={lineage} onOpenRows={onOpenRows}>
                    {body}
                  </LineageMark>
                ) : (
                  body
                );
              })()}
            </div>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10.5,
                color: V4.slate,
                textAlign: "right",
                whiteSpace: "nowrap",
                paddingTop: 3,
              }}
            >
              {finding.owner}
            </span>
            <p
              style={{
                margin: 0,
                gridColumn: "1 / -1",
                fontFamily: SANS,
                fontSize: 13,
                lineHeight: 1.5,
                color: V4.slate,
                maxWidth: "74ch",
              }}
            >
              {finding.because}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Views the rows could not support.
 *
 * Rendered at the same weight as everything else, because a table that simply vanishes tells a
 * reader this enterprise has nothing there. Naming the missing column separates a gap in the record
 * from a gap in what reached the page, and only one of those is theirs to worry about.
 */
export function UnsupportedViews({ views }: { views: UnsupportedView[] }) {
  if (views.length === 0) return null;
  return (
    <section
      data-home-unsupported={views.length}
      style={{
        padding: `26px ${PAGE_X}px 0`,
        display: "flex",
        flexDirection: "column",
        gap: 11,
      }}
    >
      <span style={eyebrow(V4.amber)}>
        {views.length === 1
          ? "One view this page cannot build"
          : `${views.length} views this page cannot build`}
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {views.map((view) => (
          <div
            key={view.caption}
            style={{
              background: V4.surface,
              border: `1px solid ${V4.rule}`,
              boxShadow: `inset 3px 0 0 ${V4.amber}`,
              padding: "13px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <span
              style={{ fontFamily: SANS, fontSize: 14.5, lineHeight: 1.45 }}
            >
              {view.caption}
            </span>
            <span
              style={{
                fontFamily: SANS,
                fontSize: 12.5,
                lineHeight: 1.5,
                color: V4.slate,
                maxWidth: "78ch",
              }}
            >
              {view.why}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * What this page holds, said before a reader scrolls it.
 *
 * Every number here already exists; stating them together is the difference between a reader
 * discovering the shape of the page by reading all of it and knowing it at the top.
 */
export function PageShape({
  tables,
  findings,
  unsupported,
}: {
  tables: TableSpec[];
  findings: Finding[];
  unsupported: UnsupportedView[];
}) {
  const exposures = findings.filter(
    (finding) => finding.kind === "exposure",
  ).length;
  const parts = [
    tables.length
      ? `${tables.length} ${tables.length === 1 ? "table" : "tables"}`
      : null,
    findings.length
      ? `${findings.length} ${findings.length === 1 ? "finding" : "findings"}`
      : null,
    exposures
      ? `${exposures} the record says ${exposures === 1 ? "is" : "are"} wrong now`
      : null,
    unsupported.length
      ? `${unsupported.length} ${unsupported.length === 1 ? "view" : "views"} this page cannot build`
      : null,
  ].filter(Boolean);
  if (parts.length === 0) return null;
  return (
    <p
      data-home-page-shape={parts.length}
      style={{
        margin: 0,
        padding: `16px ${PAGE_X}px 0`,
        fontFamily: MONO,
        fontSize: 11,
        letterSpacing: "0.04em",
        color: V4.slate,
      }}
    >
      {parts.join(" · ")}
    </p>
  );
}

/** The lead number a page opens on, with the files it came from named underneath. */
export function LeadNumber({
  statement,
  sources,
}: {
  statement: string;
  sources: string;
}) {
  return (
    <section data-home-lead style={{ padding: `26px ${PAGE_X}px 0` }}>
      <div
        style={{
          background: V4.surface,
          border: `1px solid ${V4.rule}`,
          padding: "24px 26px",
          display: "flex",
          flexDirection: "column",
          gap: 13,
        }}
      >
        <span style={eyebrow(V4.green)}>The number this page opens on</span>
        <p
          style={{
            margin: 0,
            fontFamily: SERIF,
            fontSize: 25,
            lineHeight: 1.3,
            textWrap: "balance",
          }}
        >
          {statement}
        </p>
        <p
          style={{
            margin: 0,
            fontFamily: MONO,
            fontSize: 10.5,
            lineHeight: 1.7,
            color: V4.stone,
          }}
        >
          {sources}
        </p>
      </div>
    </section>
  );
}
