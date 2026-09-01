"use client";

import type { EstateRow } from "./page-tables";
import { MONO, PAGE_X, SANS, SERIF, V4, eyebrow } from "./tokens";

/**
 * What needs a decision, across every family that carries one.
 *
 * The chapter that asks "what should leadership take up next" answered it with tables about
 * attention rather than a list of it. A table per family makes a reader assemble the queue; the
 * queue is the answer.
 *
 * Every row here comes from a declared field -- a rated severity, a declared status, a notice
 * window measured against the record's own date. Nothing is scored, weighted or inferred, because
 * a ranked list is a claim about priority and this one is the record's claim, not ours.
 */
export interface QueueItem {
  /** What the reader is being asked to look at. */
  headline: string;
  /** Where it came from, named so it can be opened. */
  family: string;
  objectType: string;
  filter: string;
  /** The record's own rating, where it declares one. */
  rated?: "high";
  /** Why this row is here, in the record's terms. */
  because: string;
}

export interface DecisionQueueResult {
  items: QueueItem[];
  /** Predicates that were checked and found nothing. Stated, so a short queue is not read as a
   *  complete one. */
  checkedAndEmpty: string[];
}

const str = (row: EstateRow, key: string) => String(row[key] ?? "").trim();
const lower = (row: EstateRow, key: string) => str(row, key).toLowerCase();

function dateOf(value: string): Date | null {
  const parsed = new Date(value.slice(0, 10));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function buildDecisionQueue(input: {
  risks?: EstateRow[];
  programs?: EstateRow[];
  contracts?: EstateRow[];
  asOf?: string;
}): DecisionQueueResult {
  const items: QueueItem[] = [];
  const checkedAndEmpty: string[] = [];

  // 1. A risk the record rates high whose control it also says is open. Both fields sit on the same
  //    row, so this is the register reading itself.
  const highOpen = (input.risks ?? []).filter(
    (row) =>
      /^(high|critical)$/.test(lower(row, "severity")) &&
      lower(row, "controlStatus") === "open",
  );
  for (const row of highOpen) {
    items.push({
      headline: str(row, "riskOrControlName") || "Unnamed risk",
      family: "Risk register",
      objectType: "risk_control",
      filter: "high",
      rated: "high",
      because: "Rated high severity with its control declared open.",
    });
  }
  if ((input.risks?.length ?? 0) > 0 && highOpen.length === 0) {
    checkedAndEmpty.push("no risk is rated high with an open control");
  }

  // 2. A programme the record itself calls at risk or delayed. Its own status field, not a reading
  //    of its progress.
  const struggling = (input.programs ?? []).filter((row) =>
    ["at_risk", "execution_delayed"].includes(lower(row, "status")),
  );
  for (const row of struggling) {
    const blocked = str(row, "blockedReason");
    items.push({
      headline: str(row, "programName") || "Unnamed programme",
      family: "Programme portfolio",
      objectType: "program_initiative",
      filter: lower(row, "status"),
      because: blocked
        ? `Declared ${lower(row, "status").replace(/_/g, " ")} — ${blocked}`
        : `Declared ${lower(row, "status").replace(/_/g, " ")} by the portfolio.`,
    });
  }
  if ((input.programs?.length ?? 0) > 0 && struggling.length === 0) {
    checkedAndEmpty.push("no programme is declared at risk or delayed");
  }

  // 3. A contract inside its own notice window that will not renew itself. Measured against the
  //    record's as-of date, never today's -- a queue whose contents change with the day it is
  //    opened is not reproducible.
  const asOf = input.asOf ? dateOf(input.asOf) : null;
  const inNotice = asOf
    ? (input.contracts ?? []).filter((row) => {
        if (
          lower(row, "autoRenewFlag") === "yes" ||
          lower(row, "autoRenewFlag") === "true"
        )
          return false;
        const end = dateOf(str(row, "termEnd") || str(row, "renewalDate"));
        const days = Number(str(row, "noticePeriodDays"));
        if (!end || !Number.isFinite(days) || days <= 0) return false;
        const opens = new Date(end.getTime() - days * 86400000);
        return opens <= asOf && asOf <= end;
      })
    : [];
  for (const row of inNotice) {
    items.push({
      headline: `${str(row, "vendorName") || "Contract"} — notice window is open`,
      family: "Vendor contracts",
      objectType: "vendor_contract",
      filter: "notice",
      because: `Term ends ${str(row, "termEnd") || str(row, "renewalDate")} with ${str(row, "noticePeriodDays")} days notice, and it does not renew itself.`,
    });
  }
  if ((input.contracts?.length ?? 0) > 0 && asOf && inNotice.length === 0) {
    checkedAndEmpty.push(
      "no contract sits inside its notice window as at the record's date",
    );
  }

  // Rated first, then the order the record declared them in. Nothing is scored.
  items.sort((a, b) => (a.rated ? 0 : 1) - (b.rated ? 0 : 1));
  return { items, checkedAndEmpty };
}

export function DecisionQueue({
  risks,
  programs,
  contracts,
  asOf,
  onOpenRows,
}: {
  risks?: EstateRow[];
  programs?: EstateRow[];
  contracts?: EstateRow[];
  asOf?: string;
  onOpenRows?: (objectType: string, filter: string) => void;
}) {
  const { items, checkedAndEmpty } = buildDecisionQueue({
    risks,
    programs,
    contracts,
    asOf,
  });
  if (items.length === 0 && checkedAndEmpty.length === 0) return null;
  return (
    <section
      data-home-decision-queue={items.length}
      style={{ padding: `30px ${PAGE_X}px 0` }}
    >
      <div style={{ borderTop: `1px solid ${V4.rule}`, paddingTop: 14 }}>
        <span style={eyebrow(V4.slate)}>What needs a decision</span>
        <h3 style={headingStyle}>
          {items.length === 0
            ? "Nothing in the record is currently waiting on a decision."
            : `${items.length} item${items.length === 1 ? "" : "s"}, in the order the record rates them.`}
        </h3>
      </div>

      <ol style={listStyle}>
        {items.map((item, index) => (
          <li key={`${item.objectType}:${item.headline}`} style={rowStyle}>
            <span style={indexStyle}>{String(index + 1).padStart(2, "0")}</span>
            <div style={{ minWidth: 0 }}>
              {item.rated ? (
                <span data-home-queue-rated style={ratedStyle}>
                  high · rated by the record
                </span>
              ) : null}
              <p style={headlineStyle}>{item.headline}</p>
              <p style={becauseStyle}>{item.because}</p>
            </div>
            <button
              type="button"
              onClick={() => onOpenRows?.(item.objectType, item.filter)}
              style={openStyle}
            >
              {item.family} →
            </button>
          </li>
        ))}
      </ol>

      {checkedAndEmpty.length > 0 ? (
        <p data-home-queue-checked style={checkedStyle}>
          Also checked, and nothing found: {checkedAndEmpty.join("; ")}. A short
          queue is a statement about the record, not a statement that all is
          well.
        </p>
      ) : null}
    </section>
  );
}

const headingStyle = {
  margin: "7px 0 0",
  fontFamily: SERIF,
  fontSize: 23,
  fontWeight: 500,
  lineHeight: 1.22,
  maxWidth: "56ch",
} as const;

const listStyle = {
  listStyle: "none",
  margin: "18px 0 0",
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: 2,
} as const;

const rowStyle = {
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr) auto",
  gap: 18,
  alignItems: "start",
  background: V4.surface,
  border: `1px solid ${V4.rule}`,
  padding: "15px 18px",
} as const;

const indexStyle = {
  fontFamily: MONO,
  fontSize: 12,
  fontWeight: 600,
  color: V4.stone,
  paddingTop: 3,
} as const;

const ratedStyle = {
  display: "block",
  fontFamily: MONO,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  color: V4.red,
  marginBottom: 6,
} as const;

const headlineStyle = {
  margin: 0,
  fontFamily: SANS,
  fontSize: 15.5,
  lineHeight: 1.45,
  color: V4.ink,
  maxWidth: "62ch",
} as const;

const becauseStyle = {
  margin: "5px 0 0",
  fontFamily: SANS,
  fontSize: 13,
  lineHeight: 1.5,
  color: V4.slate,
  maxWidth: "70ch",
} as const;

const openStyle = {
  fontFamily: MONO,
  fontSize: 10.5,
  letterSpacing: "0.05em",
  color: V4.blue,
  background: "transparent",
  border: "none",
  padding: 0,
  cursor: "pointer",
  whiteSpace: "nowrap" as const,
} as const;

const checkedStyle = {
  margin: "14px 0 0",
  fontFamily: SANS,
  fontSize: 12.5,
  lineHeight: 1.55,
  color: V4.slate,
  maxWidth: "80ch",
} as const;
