import type {
  Finding,
  FindingKind,
  TableSpec,
  UnsupportedView,
} from "./page-tables";
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

export function TableSet({ tables }: { tables: TableSpec[] }) {
  if (tables.length === 0) return null;
  return (
    <section
      data-home-table-set
      style={{
        padding: `28px ${PAGE_X}px 0`,
        display: "grid",
        gridTemplateColumns:
          tables.length === 1
            ? "minmax(0, 1fr)"
            : "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
        gap: 26,
        alignItems: "start",
      }}
    >
      {tables.map((table) => (
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
                        }}
                      >
                        {cell}
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
                        {cell}
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
      ))}
    </section>
  );
}

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
      <span
        style={eyebrow(V4.slate)}
        data-home-findings-count={findings.length}
      >
        What does not reconcile — {count} today
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {findings.map((finding) => (
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
                fontSize: 15,
                lineHeight: 1.5,
                maxWidth: "68ch",
              }}
            >
              {(() => {
                const lineage = lineageForFinding(finding);
                // A finding a reader cannot reproduce is an assertion, and an assertion carrying an
                // owner's name is worse than none -- so the rule that produced it travels with it.
                return lineage ? (
                  <LineageMark lineage={lineage} onOpenRows={onOpenRows}>
                    {finding.claim}
                  </LineageMark>
                ) : (
                  finding.claim
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
