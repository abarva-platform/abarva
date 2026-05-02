import type {
  SetupAiInitiativeRecord,
  SetupAiInitiativeSummary,
} from "@/lib/setup";
import { EditorialCanvas } from "@/components/admin/EditorialCanvas";
import { COLORS, RADIUS, SPACING } from "@/lib/design/design-tokens";
import { SHELL } from "@/lib/shell/shell-tokens";

interface Props {
  tenantName: string;
  records: readonly SetupAiInitiativeRecord[];
  summary: SetupAiInitiativeSummary;
  source: "private_db" | "fixture_fallback";
}
function label(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function SetupAiInitiativesPage({
  tenantName,
  records,
  summary,
  source,
}: Props) {
  const risks = records
    .flatMap((record) => record.riskSignals.map((risk) => ({ record, risk })))
    .filter((item) => item.risk.severity === "high")
    .slice(0, 4);
  return (
    <EditorialCanvas
      eyebrow={`Setup · ${tenantName}`}
      title="AI initiatives registry"
      subtitle="Private-plane registry of AbarVa Programs, external AI rollouts, vendor AI features, and internal builds that Tower and the agents can observe without mixing client data."
    >
      <div
        data-testid="setup-ai-initiatives-page"
        style={{ display: "flex", flexDirection: "column", gap: SPACING.lg }}
      >
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: SPACING.md,
          }}
        >
          {[
            ["Total initiatives", summary.total],
            ["At risk", summary.atRisk],
            ["Active / realizing", summary.activeOrRealizing],
            ["Linked Programs", summary.linkedPrograms],
          ].map(([metricLabel, value]) => (
            <div
              key={metricLabel}
              style={{
                background: SHELL.CARD_WHITE,
                border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
                borderRadius: RADIUS.lg,
                padding: SPACING.lg,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontFamily: SHELL.MONO,
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: SHELL.INK_MUTED,
                }}
              >
                {metricLabel}
              </p>
              <p
                style={{
                  margin: "8px 0 0",
                  fontFamily: SHELL.SERIF,
                  fontSize: 34,
                  color: SHELL.INK,
                }}
              >
                {value}
              </p>
            </div>
          ))}
        </section>
        <section
          style={{
            background: COLORS.skyPale,
            border: `1px solid ${COLORS.navy}22`,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: SHELL.MONO,
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: COLORS.navy,
            }}
          >
            Tower feed contract · {source}
          </p>
          <p
            style={{
              margin: "8px 0 0",
              fontFamily: SHELL.SANS,
              fontSize: 14,
              color: SHELL.INK_SOFT,
              lineHeight: 1.6,
            }}
          >
            Tower can poll{" "}
            <code>/api/setup/initiatives?tenantKey={summary.tenantKey}</code>.
            Exact financial values are hidden unless financial visibility is
            explicitly granted; directional summaries remain available for
            agents.
          </p>
        </section>
        <section style={{ display: "grid", gap: SPACING.md }}>
          {records.map((record) => (
            <article
              key={record.initiativeId}
              style={{
                background: SHELL.CARD_WHITE,
                border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
                borderRadius: RADIUS.lg,
                padding: SPACING.lg,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontFamily: SHELL.MONO,
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: SHELL.INK_MUTED,
                }}
              >
                {label(record.archetype)} · {record.status}
              </p>
              <h2
                style={{
                  margin: "6px 0 0",
                  fontFamily: SHELL.SERIF,
                  fontSize: 22,
                  color: SHELL.INK,
                }}
              >
                {record.name}
              </h2>
              <p
                style={{
                  margin: "12px 0 0",
                  fontFamily: SHELL.SANS,
                  fontSize: 14,
                  color: SHELL.INK_SOFT,
                  lineHeight: 1.6,
                }}
              >
                {record.directionalSummary.value}
              </p>
              <p
                style={{
                  margin: "10px 0 0",
                  fontFamily: SHELL.SANS,
                  fontSize: 12,
                  color: SHELL.INK_MUTED,
                }}
              >
                {record.sponsorRole} · {record.ownerRole} ·{" "}
                {record.vendor ?? record.internalTeam ?? "Internal"} ·{" "}
                {record.linkedProgramId ? "Program-linked" : "External"}
              </p>
            </article>
          ))}
        </section>
        {risks.length > 0 && (
          <section
            style={{
              background: COLORS.amberSoft,
              borderRadius: RADIUS.lg,
              padding: SPACING.lg,
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: SHELL.MONO,
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: COLORS.amberInk,
              }}
            >
              Steward hygiene issues
            </p>
            <ul
              style={{
                margin: "10px 0 0",
                paddingLeft: 18,
                fontFamily: SHELL.SANS,
                color: COLORS.amberInk,
                lineHeight: 1.7,
              }}
            >
              {risks.map(({ record, risk }) => (
                <li key={`${record.initiativeId}:${risk.type}`}>
                  <strong>{record.name}:</strong> {risk.description}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </EditorialCanvas>
  );
}
