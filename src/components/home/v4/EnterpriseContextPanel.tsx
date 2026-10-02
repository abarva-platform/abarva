import type { ReactNode } from "react";
import type {
  EnterpriseContextFact,
  HomeEnterpriseContext,
} from "@/lib/home/preview/ecl-enterprise-context";
import type { ChapterId } from "@/lib/home/preview/types";
import { PAGE_X, SANS, V4 } from "./tokens";

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

function Drill({
  label,
  type,
  filter,
  onOpenRows,
}: {
  label: string;
  type: string;
  filter: string;
  onOpenRows: (type: string, filter: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpenRows(type, filter)}
      title={`Open ${label.toLowerCase()} in the governed record`}
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
}: {
  chapterId: ChapterId;
  context: HomeEnterpriseContext;
  onOpenRows: (type: string, filter: string) => void;
}) {
  if (
    ![
      "executive_brief",
      "our_business",
      "strategy_value_creation",
      "how_we_operate",
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
    "Enterprise shared";

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
        Synthetic reference · Not client-attested · Source-linked governed rows
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
            {context.profile.annualRevenueUsd !== null
              ? metric(
                  "Declared annual revenue",
                  money(context.profile.annualRevenueUsd),
                )
              : null}
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
            {context.sharedFunctionIds.length} functions serve the enterprise
            across segments; {context.unlinkedPrograms.length} program
            {context.unlinkedPrograms.length === 1 ? " has" : "s have"} no
            declared priority. Changes over time are not established by this
            view.
          </p>
          <div style={{ marginTop: 16 }}>
            <Drill
              label="Examine segments"
              type="business_segment"
              filter=""
              onOpenRows={onOpenRows}
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
            Revenue shares are declared in the source. Resource shares count
            only segment-attributed rows; shared functions remain outside the
            denominator.
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
                      type="business_segment"
                      filter={segment.segmentKey}
                      onOpenRows={onOpenRows}
                    />
                  </td>
                  <td style={CELL_STYLE}>{money(segment.revenueUsd)}</td>
                  <td style={CELL_STYLE}>
                    {segment.revenueSharePct.toFixed(1)}%
                  </td>
                  <td style={CELL_STYLE}>
                    {segment.pnlOwnerRole || "Not recorded"}
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
            Shared or unattributed:{" "}
            {context.segmentSpine.unattributed.applications} applications,{" "}
            {context.segmentSpine.unattributed.programs} programs,{" "}
            {context.segmentSpine.unattributed.risks} risks. Customer/channel
            economics are not established by this record.
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
                    type="program_initiative"
                    filter={priority.rowKey}
                    onOpenRows={onOpenRows}
                  />
                </td>
                <td style={CELL_STYLE}>
                  {priority.ownerRole ?? "Not recorded"}
                </td>
                <td style={CELL_STYLE}>
                  {priority.targetOutcome ?? "Not recorded"}
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
                    type="program_initiative"
                    filter={program.rowKey}
                    onOpenRows={onOpenRows}
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
                    type="business_function"
                    filter={fn.rowKey}
                    onOpenRows={onOpenRows}
                  />
                </td>
                <td style={CELL_STYLE}>{segmentName(fn.segmentKey)}</td>
                <td style={CELL_STYLE}>
                  {fn.executiveOwner ?? "Not recorded"}
                </td>
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
            {context.sharedFunctionIds.length} shared functions are deliberately
            not allocated to one segment. Function-level accountability is
            recorded; decision rights are not inferred.
          </p>
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
                    <Drill label="View risk" type="risk_control" filter={risk.rowKey} onOpenRows={onOpenRows} />
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
          {context.excludedUncitedRows} source row
          {context.excludedUncitedRows === 1 ? " was" : "s were"} excluded from
          these totals because a verified citation was unavailable.
        </p>
      ) : null}
    </section>
  );
}
