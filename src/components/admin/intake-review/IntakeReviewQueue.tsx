import { COLORS } from "@/lib/design/design-tokens";
import type { ReviewGroup, ReviewQueue } from "@/lib/enterprise-data/intake/review-read-model";

/**
 * The review surface.
 *
 * Every design decision here is in service of one thing: making it harder to approve without
 * looking than to look. So the evidence is on the card rather than behind a disclosure, the count
 * that leads is the number of DECISIONS rather than the number of proposals, and the groups that
 * need individual attention are visually separate from the ones that do not -- not merely sorted
 * differently, which reads as the same list in a different order.
 *
 * There is deliberately no "approve all" control. A reviewer who wants to accept everything can
 * accept each group, and the friction is the point: the whole layer exists because a surface that
 * can be cleared in one click is one that gets cleared without being read.
 */

const CARD: React.CSSProperties = {
  border: `1px solid ${COLORS.ink}14`,
  borderRadius: 10,
  background: COLORS.white,
  padding: "20px 22px",
};

function Pill({ tone, children }: { tone: "amber" | "sky" | "mint"; children: React.ReactNode }) {
  const map = {
    amber: { bg: COLORS.amberSoft, fg: COLORS.amberInk },
    sky: { bg: COLORS.skyPale, fg: COLORS.navy },
    mint: { bg: COLORS.mintSoft, fg: COLORS.mintInk },
  } as const;
  return (
    <span
      style={{
        background: map[tone].bg,
        color: map[tone].fg,
        fontSize: 11,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        padding: "3px 9px",
        borderRadius: 999,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function EvidenceTable({ group }: { group: ReviewGroup }) {
  const fields = Object.keys(group.samples[0]?.evidence ?? {});
  if (!fields.length) return null;
  return (
    <div style={{ overflowX: "auto", marginTop: 14 }}>
      <table style={{ borderCollapse: "collapse", fontSize: 13, width: "100%", minWidth: 420 }}>
        <thead>
          <tr>
            <th style={th}>Row</th>
            {fields.map((f) => (
              <th key={f} style={th}>
                {f}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {group.samples.map((s) => (
            <tr key={s.sourceRowId}>
              <td style={{ ...td, color: `${COLORS.ink}88`, fontVariantNumeric: "tabular-nums" }}>{s.sourceRowId}</td>
              {fields.map((f) => (
                <td key={f} style={td}>
                  {s.evidence[f]?.trim() ? (
                    s.evidence[f]
                  ) : (
                    // Blank is a fact about the record, not an empty cell to skim past.
                    <span style={{ color: COLORS.amberInk }}>not recorded</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {group.rowCount > group.samples.length ? (
        <p style={{ fontSize: 12, color: `${COLORS.ink}77`, marginTop: 8 }}>
          Showing {group.samples.length} of {group.rowCount} rows this decision covers.
        </p>
      ) : null}
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "6px 12px 6px 0",
  fontWeight: 600,
  fontSize: 11,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: `${COLORS.ink}77`,
  borderBottom: `1px solid ${COLORS.ink}14`,
  whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  padding: "7px 12px 7px 0",
  borderBottom: `1px solid ${COLORS.ink}0A`,
  verticalAlign: "top",
};

function GroupCard({ group }: { group: ReviewGroup }) {
  const individual = group.kind === "individual_only";
  return (
    <article
      style={{
        ...CARD,
        borderLeft: `3px solid ${individual ? COLORS.amberInk : COLORS.navy}`,
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
        <Pill tone={individual ? "amber" : "sky"}>
          {individual ? "Decide individually" : `${group.rowCount} rows`}
        </Pill>
        <span style={{ fontSize: 12, color: `${COLORS.ink}88` }}>{group.templateFile}</span>
      </div>

      <h3 style={{ fontSize: 17, lineHeight: 1.4, margin: 0, color: COLORS.ink, textWrap: "balance" }}>
        {group.question}
      </h3>
      <p style={{ fontSize: 13, color: `${COLORS.ink}99`, margin: "6px 0 0" }}>{group.priorityReason}</p>

      <EvidenceTable group={group} />

      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
        <button type="button" style={primaryButton} disabled>
          Approve{group.rowCount > 1 ? ` all ${group.rowCount}` : ""}
        </button>
        <button type="button" style={secondaryButton} disabled>
          Reject
        </button>
      </div>
    </article>
  );
}

const primaryButton: React.CSSProperties = {
  background: COLORS.navy,
  color: COLORS.white,
  border: "none",
  borderRadius: 7,
  padding: "9px 18px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "not-allowed",
  opacity: 0.45,
};

const secondaryButton: React.CSSProperties = {
  background: COLORS.white,
  color: COLORS.ink,
  border: `1px solid ${COLORS.ink}22`,
  borderRadius: 7,
  padding: "9px 18px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "not-allowed",
  opacity: 0.45,
};

export function IntakeReviewQueue({ queue, tenantName }: { queue: ReviewQueue; tenantName: string }) {
  const { summary } = queue;

  return (
    <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: 24 }}>
      <header>
        <p style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: `${COLORS.ink}77`, margin: 0 }}>
          {tenantName} · Intake review
        </p>
        <h1 style={{ fontSize: 30, lineHeight: 1.2, margin: "8px 0 0", color: COLORS.ink, textWrap: "balance" }}>
          {summary.decisionCount === 0
            ? "Nothing is waiting for review"
            : `${summary.decisionCount} ${summary.decisionCount === 1 ? "decision" : "decisions"} to make`}
        </h1>
        {summary.decisionCount > 0 ? (
          <p style={{ fontSize: 14, color: `${COLORS.ink}99`, margin: "10px 0 0", maxWidth: "62ch", lineHeight: 1.6 }}>
            {summary.proposalCount} proposed values, grouped into {summary.decisionCount} judgements.
            {summary.individualCount > 0
              ? ` ${summary.individualCount} must be decided one at a time, because each has no group it can be judged as part of.`
              : ""}{" "}
            Nothing here enters the record until it is approved.
          </p>
        ) : null}
      </header>

      {summary.declinedCount > 0 ? (
        <aside style={{ ...CARD, background: COLORS.amberSoft, border: `1px solid ${COLORS.amberInk}33` }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
            <Pill tone="amber">Ask the client</Pill>
          </div>
          <p style={{ fontSize: 14, color: COLORS.ink, margin: 0, lineHeight: 1.6, maxWidth: "62ch" }}>
            {summary.declinedCount} cells came back as unknown. That is a correct answer, not a
            failure — it is the list of what the client&rsquo;s own architects still need to tell us, and
            it is not something to decide here.
          </p>
        </aside>
      ) : null}

      {queue.groups.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {queue.groups.map((g) => (
            <GroupCard key={g.groupId} group={g} />
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 14, color: `${COLORS.ink}99`, lineHeight: 1.6, maxWidth: "62ch" }}>
          No enrichment run has proposals awaiting a decision for this tenant.
        </p>
      )}
    </div>
  );
}
