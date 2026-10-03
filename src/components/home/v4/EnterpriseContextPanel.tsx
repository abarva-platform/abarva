import type { ReactNode } from "react";
import type {
  AttributionGap,
  EnterpriseContextFact,
  HomeEnterpriseContext,
} from "@/lib/home/preview/ecl-enterprise-context";
import type { ChapterId } from "@/lib/home/preview/types";
import type { RecordRowMatch } from "./RecordBrowser";
import { formatValueMoney } from "@/lib/home/preview/value-proof-format";
import { PAGE_X, SANS, V4 } from "./tokens";

/** What a reader is told when the record holds no value. Never a zero, never a blank. */
const NOT_RECORDED = "Not recorded";

const HEADER_STYLE = {
  color: V4.slate,
  fontFamily: SANS,
  fontSize: 11,
  fontWeight: 700,
  padding: "11px 10px",
  textAlign: "left" as const,
  verticalAlign: "bottom" as const,
};
const CELL_STYLE = {
  borderTop: `1px solid ${V4.rule}`,
  color: V4.ink,
  fontFamily: SANS,
  fontSize: 13,
  lineHeight: 1.4,
  padding: "12px 10px",
  verticalAlign: "top" as const,
};

function money(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1_000_000_000 ? 1 : 0,
    notation: "compact",
  }).format(value);
}

function Evidence({ fact }: { fact: EnterpriseContextFact }) {
  return (
    <span style={{ color: V4.slate, fontSize: 12 }}>
      {fact.asOf ? `As of ${fact.asOf}` : "Source date not established"}
      {` · ${fact.sourceRefs.length} source ${fact.sourceRefs.length === 1 ? "record" : "records"}`}
    </span>
  );
}

function Drill({ label, onOpen }: { label: string; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      title={`Open ${label.toLowerCase()} in the record`}
      style={{
        border: 0,
        background: "none",
        padding: 0,
        color: V4.blue,
        cursor: "pointer",
        fontFamily: SANS,
        fontSize: 12,
        fontWeight: 650,
      }}
    >
      {label}
    </button>
  );
}

function Table({
  headers,
  children,
  minWidth = 700,
}: {
  headers: string[];
  children: ReactNode;
  minWidth?: number;
}) {
  return (
    <div style={{ overflowX: "auto", maxWidth: "100%" }}>
      <table style={{ borderCollapse: "collapse", minWidth, width: "100%" }}>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} style={HEADER_STYLE}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function metric(label: string, value: string) {
  return (
    <div
      key={label}
      style={{ minWidth: 0, borderTop: `2px solid ${V4.blue}`, paddingTop: 12 }}
    >
      <strong
        style={{
          display: "block",
          color: V4.ink,
          fontFamily: SANS,
          fontSize: 26,
          lineHeight: 1.15,
        }}
      >
        {value}
      </strong>
      <span style={{ color: V4.slate, fontFamily: SANS, fontSize: 12 }}>
        {label}
      </span>
    </div>
  );
}

export function EnterpriseContextPanel({
  chapterId,
  context,
  onOpenRows,
  onOpenMatch,
}: {
  chapterId: ChapterId;
  context: HomeEnterpriseContext;
  onOpenRows: (type: string, filter: string) => void;
  /** Opens the rows a figure was counted from, found by the identifier the count joined on. */
  onOpenMatch: (type: string, match: RecordRowMatch) => void;
}) {
  if (
    ![
      "executive_brief",
      "our_business",
      "strategy_value_creation",
      "how_we_operate",
      "performance_value",
      "what_needs_attention",
    ].includes(chapterId)
  )
    return null;

  const atRiskPrograms = context.priorities.reduce(
    (sum, priority) => sum + priority.atRiskProgramCount,
    0,
  );
  const segments = context.segmentSpine.segments;
  const total = (domain: string) =>
    segments.reduce((sum, segment) => sum + segment.domains[domain].count, 0) +
    (context.segmentSpine.unattributed[domain] ?? 0);
  const segmentName = (key: string | null) =>
    segments.find((segment) => segment.segmentKey === key)?.segmentName ??
    "No declared segment";
  const gaps = context.attributionGaps;
  // Counted outside every segment, by the reason. One figure for all three would read as a
  // deliberate arrangement when part of it is a link that does not resolve.
  const outsideSegments = (cause: keyof AttributionGap) => ({
    applications: gaps.applications[cause],
    programs: gaps.programs[cause],
    risks: gaps.risks[cause],
  });
  const noSegment = outsideSegments("functionWithoutSegment");
  const notInRecord = outsideSegments("functionNotInRecord");
  const noFunction = outsideSegments("noFunctionRecorded");
  const any = (counts: typeof noSegment) =>
    counts.applications + counts.programs + counts.risks > 0;
  const counted = (count: number, noun: string) =>
    `${count.toLocaleString()} ${noun}${count === 1 ? "" : "s"}`;
  const listed = (counts: typeof noSegment) =>
    `${counted(counts.applications, "application")}, ${counted(counts.programs, "program")}, ${counted(counts.risks, "risk")}`;

  return (
    <section
      data-home-enterprise-context={chapterId}
      style={{
        padding: `28px ${PAGE_X}px 36px`,
        borderBottom: `1px solid ${V4.rule}`,
      }}
    >
      <p
        style={{
          color: V4.slate,
          fontFamily: SANS,
          fontSize: 12,
          margin: "0 0 20px",
        }}
      >
        Synthetic reference · Not client-attested · Source-linked records
      </p>
      {chapterId === "executive_brief" ? (
        <>
          <p
            style={{
              color: V4.ink,
              fontFamily: SANS,
              fontSize: 18,
              lineHeight: 1.35,
              margin: "0 0 8px",
              maxWidth: 850,
            }}
          >
            {context.profile.businessModel}
          </p>
          <Evidence fact={context.profile} />
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(min(100%,160px),1fr))",
              gap: 18,
              margin: "26px 0",
            }}
          >
            {metric(
              "Declared annual revenue",
              context.profile.annualRevenueUsd !== null
                ? money(context.profile.annualRevenueUsd)
                : NOT_RECORDED,
            )}
            {metric("Business segments", String(segments.length))}
            {metric("Declared priorities", String(context.priorities.length))}
            {metric("Programs", String(total("programs")))}
            {metric("At-risk linked programs", String(atRiskPrograms))}
            {metric(
              "High/critical risks with partial or unknown controls",
              String(context.riskTriage.attentionRisks.length),
            )}
          </div>
          <p
            style={{
              color: V4.inkSoft,
              fontFamily: SANS,
              fontSize: 13,
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            {context.sharedFunctionIds.length} function
            {context.sharedFunctionIds.length === 1 ? " has" : "s have"} no
            declared segment; {context.unlinkedPrograms.length} program
            {context.unlinkedPrograms.length === 1 ? " has" : "s have"} no
            declared priority. Changes over time are not established by this
            view.
          </p>
          <div style={{ marginTop: 16 }}>
            <Drill
              label="Examine segments"
              onOpen={() => onOpenRows("business_segment", "")}
            />
          </div>
        </>
      ) : null}
      {chapterId === "our_business" ? (
        <>
          <p
            style={{
              color: V4.inkSoft,
              fontFamily: SANS,
              fontSize: 13,
              lineHeight: 1.5,
              margin: "0 0 14px",
            }}
          >
            Revenue shares are declared in the source. Segment counts include
            only records whose function has a declared segment.
          </p>
          <Table
            headers={[
              "Segment",
              "Revenue",
              "Revenue share",
              "P&L owner",
              "Applications",
              "Programs",
              "Risks",
              "Evidence",
            ]}
            minWidth={860}
          >
            {segments.map((segment) => {
              const fact = context.segmentFacts[segment.segmentKey];
              return (
                <tr key={segment.segmentKey}>
                  <td style={CELL_STYLE}>
                    <strong>{segment.segmentName}</strong>
                    <br />
                    <Drill
                      label="View segment"
                      onOpen={() =>
                        onOpenMatch("business_segment", {
                          field: "segmentKey",
                          value: segment.segmentKey,
                          label: segment.segmentName,
                        })
                      }
                    />
                  </td>
                  <td style={CELL_STYLE}>
                    {fact.revenueUsd !== null
                      ? money(fact.revenueUsd)
                      : NOT_RECORDED}
                  </td>
                  <td style={CELL_STYLE}>
                    {fact.revenueSharePct !== null
                      ? `${fact.revenueSharePct.toFixed(1)}%`
                      : NOT_RECORDED}
                  </td>
                  <td style={CELL_STYLE}>
                    {segment.pnlOwnerRole || NOT_RECORDED}
                  </td>
                  <td style={CELL_STYLE}>
                    {segment.domains.applications.count.toLocaleString()}
                  </td>
                  <td style={CELL_STYLE}>
                    {segment.domains.programs.count.toLocaleString()}
                  </td>
                  <td style={CELL_STYLE}>
                    {segment.domains.risks.count.toLocaleString()}
                  </td>
                  <td style={CELL_STYLE}>
                    <Evidence fact={fact} />
                  </td>
                </tr>
              );
            })}
          </Table>
          <p
            style={{
              color: V4.slate,
              fontFamily: SANS,
              fontSize: 12,
              lineHeight: 1.5,
              margin: "14px 0 0",
            }}
          >
            Under functions with no declared segment: {listed(noSegment)}.{" "}
            {any(notInRecord)
              ? `Naming a function that is not in this record: ${listed(notInRecord)}. `
              : null}
            {any(noFunction)
              ? `With no function recorded: ${listed(noFunction)}. `
              : null}
            Customer/channel economics are not established by this record.
          </p>
        </>
      ) : null}
      {chapterId === "strategy_value_creation" ? (
        <>
          <Table
            headers={[
              "Declared priority",
              "Owner",
              "Target",
              "Programs",
              "At risk",
              "KPIs",
              "Evidence",
            ]}
            minWidth={840}
          >
            {context.priorities.map((priority) => (
              <tr key={priority.rowKey}>
                <td style={CELL_STYLE}>
                  <strong>{priority.title}</strong>
                  <br />
                  <Drill
                    label="View programs"
                    onOpen={() =>
                      onOpenMatch("program_initiative", {
                        field: "priorityId",
                        value: priority.priorityId,
                        label: priority.title,
                      })
                    }
                  />
                </td>
                <td style={CELL_STYLE}>{priority.ownerRole ?? NOT_RECORDED}</td>
                <td style={CELL_STYLE}>
                  {priority.targetOutcome ?? NOT_RECORDED}
                </td>
                <td style={CELL_STYLE}>{priority.programCount}</td>
                <td style={CELL_STYLE}>{priority.atRiskProgramCount}</td>
                <td style={CELL_STYLE}>{priority.metricCount}</td>
                <td style={CELL_STYLE}>
                  <Evidence fact={priority} />
                </td>
              </tr>
            ))}
          </Table>
          {context.unlinkedPrograms.length > 0 ? (
            <p
              style={{
                color: V4.inkSoft,
                fontFamily: SANS,
                fontSize: 13,
                margin: "14px 0 0",
              }}
            >
              {context.unlinkedPrograms.length} program
              {context.unlinkedPrograms.length === 1 ? " is" : "s are"} not
              linked to a declared priority:{" "}
              {context.unlinkedPrograms.map((program, index) => (
                <span key={program.rowKey}>
                  {index > 0 ? ", " : ""}
                  <Drill
                    label={program.title}
                    onOpen={() =>
                      onOpenMatch("program_initiative", {
                        field: "originalRowId",
                        value: program.programId,
                        label: program.title,
                      })
                    }
                  />
                </span>
              ))}
              . Targets and KPIs are not proof of realized value.
            </p>
          ) : null}
        </>
      ) : null}
      {chapterId === "how_we_operate" ? (
        <>
          <Table
            headers={[
              "Function",
              "Segment",
              "Executive owner",
              "Applications",
              "Programs",
              "Risks",
              "Evidence",
            ]}
            minWidth={840}
          >
            {context.functions.map((fn) => (
              <tr key={fn.rowKey}>
                <td style={CELL_STYLE}>
                  <strong>{fn.title}</strong>
                  <br />
                  <Drill
                    label="View function"
                    onOpen={() =>
                      onOpenMatch("business_function", {
                        field: "functionId",
                        value: fn.functionId,
                        label: fn.title,
                      })
                    }
                  />
                </td>
                <td style={CELL_STYLE}>{segmentName(fn.segmentKey)}</td>
                <td style={CELL_STYLE}>{fn.executiveOwner ?? NOT_RECORDED}</td>
                <td style={CELL_STYLE}>{fn.applicationCount}</td>
                <td style={CELL_STYLE}>{fn.programCount}</td>
                <td style={CELL_STYLE}>{fn.riskCount}</td>
                <td style={CELL_STYLE}>
                  <Evidence fact={fn} />
                </td>
              </tr>
            ))}
          </Table>
          <p
            style={{
              color: V4.slate,
              fontFamily: SANS,
              fontSize: 12,
              margin: "14px 0 0",
            }}
          >
            {context.sharedFunctionIds.length} function
            {context.sharedFunctionIds.length === 1 ? " has" : "s have"} no
            declared segment. Function-level accountability is recorded;
            decision rights are not inferred.
          </p>
        </>
      ) : null}
      {chapterId === "performance_value" ? (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,170px),1fr))",
              gap: 18,
              marginBottom: 24,
            }}
          >
            {metric("Approved program budgets", formatValueMoney(context.valueProof.approvedBudgetUsd))}
            {metric("Program forecasts", formatValueMoney(context.valueProof.forecastUsd))}
            {metric("Forecast above budget", `${context.valueProof.overBudgetProgramCount} of ${context.valueProof.programCount}`)}
            {metric("Client-attested realized benefits", "Not established")}
          </div>
          <h2 style={{ fontFamily: SANS, fontSize: 20, margin: "0 0 8px" }}>
            Investment versus proof
          </h2>
          <p style={{ color: V4.slate, fontFamily: SANS, fontSize: 12, margin: "0 0 8px" }}>
            {context.valueProof.programCount} source-linked program records · {context.valueProof.asOf ? `As of ${context.valueProof.asOf}` : "Source date not established"}
          </p>
          <p style={{ color: V4.inkSoft, fontFamily: SANS, fontSize: 13, lineHeight: 1.5 }}>
            Program budgets and forecasts are declared estimates, not realized
            benefits. {context.valueProof.modelledClaimCount} value claims are
            modelled but not finance-validated; {context.valueProof.unsupportedClaimCount} {context.valueProof.unsupportedClaimCount === 1 ? "is" : "are"} unsupported.
            This synthetic record does not establish client-attested realized value.
          </p>
          <Table
            headers={["Declared priority", "Owner", "Programs", "Approved budget", "Forecast", "Above budget", "Evidence"]}
            minWidth={950}
          >
            {context.valueProof.priorities.map((priority) => (
              <tr key={priority.rowKey}>
                <td style={CELL_STYLE}>
                  <strong>{priority.title}</strong>
                  <br />
                  {priority.unlinked ? null : (
                    <Drill label="View programs" onOpen={() => onOpenRows("program_initiative", priority.rowKey)} />
                  )}
                </td>
                <td style={CELL_STYLE}>{priority.ownerRole ?? "Not recorded"}</td>
                <td style={CELL_STYLE}>{priority.programCount}</td>
                <td style={CELL_STYLE}>{formatValueMoney(priority.approvedBudgetUsd)}</td>
                <td style={CELL_STYLE}>{formatValueMoney(priority.forecastUsd)}</td>
                <td style={CELL_STYLE}>{priority.overBudgetProgramCount}</td>
                <td style={CELL_STYLE}><Evidence fact={priority} /></td>
              </tr>
            ))}
          </Table>
          <p style={{ color: V4.slate, fontFamily: SANS, fontSize: 12, lineHeight: 1.5, margin: "14px 0 0" }}>
            Totals include {context.unlinkedPrograms.length} program{context.unlinkedPrograms.length === 1 ? "" : "s"} without a declared priority.
            {context.valueProof.missingFinancialCount > 0 ? ` ${context.valueProof.missingFinancialCount} program financial records are incomplete.` : ""}
            {context.valueProof.otherClaimCount > 0 ? ` ${context.valueProof.otherClaimCount} claim statuses need separate review.` : ""}
            {` ${context.valueProof.excludedSpendLines} of ${context.valueProof.completedPeriodSpendLines + context.valueProof.excludedSpendLines} spend records lack a verifiable completed-period actual and are excluded from current-period spend.`}
          </p>
          <div style={{ marginTop: 16 }}>
            <Drill label="Examine all programs" onOpen={() => onOpenRows("program_initiative", "")} />
          </div>
        </>
      ) : null}
      {chapterId === "what_needs_attention" ? (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,170px),1fr))",
              gap: 18,
              marginBottom: 24,
            }}
          >
            {metric("Risks in the record", String(context.riskTriage.totalRisks))}
            {metric("High or critical", String(context.riskTriage.highOrCritical))}
            {metric("High/critical with partial control", String(context.riskTriage.partialControl))}
            {metric("High/critical with unknown control", String(context.riskTriage.unknownControl))}
          </div>
          <h2 style={{ fontFamily: SANS, fontSize: 20, margin: "0 0 8px" }}>
            Risk review queue
          </h2>
          <p style={{ color: V4.inkSoft, fontFamily: SANS, fontSize: 13, lineHeight: 1.5 }}>
            High and critical risks with a partially effective or unknown control
            state lead this queue. Unknown is not the same as uncontrolled. This
            is a review order, not a calculated risk score.
          </p>
          {context.riskTriage.attentionRisks.length ? (
            <Table
              headers={["Risk", "Severity", "Control state", "Recorded role", "Affected record", "Evidence"]}
              minWidth={980}
            >
              {context.riskTriage.attentionRisks.slice(0, 10).map((risk) => (
                <tr key={risk.rowKey}>
                  <td style={CELL_STYLE}>
                    <strong>{risk.title}</strong>
                    {risk.functionName || risk.riskType ? (
                      <span style={{ display: "block", color: V4.slate }}>
                        {[risk.functionName, risk.riskType?.replaceAll("_", " ")].filter(Boolean).join(" · ")}
                      </span>
                    ) : null}
                    <Drill
                      label="View risk"
                      onOpen={() => onOpenRows("risk_control", risk.rowKey)}
                    />
                  </td>
                  <td style={CELL_STYLE}>{risk.severity}</td>
                  <td style={CELL_STYLE}>{risk.controlState === "unknown" ? "Unknown" : "Partially effective"}</td>
                  <td style={CELL_STYLE}>{risk.ownerRole ?? "Not recorded"}</td>
                  <td style={CELL_STYLE}>{risk.affectedObject ?? "Not resolved"}</td>
                  <td style={CELL_STYLE}><Evidence fact={risk} /></td>
                </tr>
              ))}
            </Table>
          ) : (
            <p style={{ color: V4.slate, fontFamily: SANS, fontSize: 13 }}>
              No high or critical risk has a partially effective or unknown control state in this record.
            </p>
          )}
          <p style={{ color: V4.slate, fontFamily: SANS, fontSize: 12, margin: "14px 0 0" }}>
            Showing {Math.min(10, context.riskTriage.attentionRisks.length)} of {context.riskTriage.attentionRisks.length} review items.
            Control effectiveness has not been independently attested here.
            {context.riskTriage.ownerIsConstant ? " The same role appears on every risk; item-level accountability is not established." : ""}
          </p>
        </>
      ) : null}
      {context.excludedUncitedRows > 0 ? (
        <p
          style={{
            color: V4.inkSoft,
            fontFamily: SANS,
            fontSize: 12,
            margin: "20px 0 0",
          }}
        >
          {context.excludedUncitedRows} record
          {context.excludedUncitedRows === 1 ? " was" : "s were"} excluded from
          these totals because a verified citation was unavailable.
        </p>
      ) : null}
    </section>
  );
}
