import { AdminCanonShellV2 } from "@/components/admin/AdminCanonShellV2";
import { ADMIN_PAGE_HEADER_STYLES } from "@/components/admin/admin-page-header-styles";
import { resolveAdminTenant } from "@/lib/admin/admin-tenant";
import { getClientOption } from "@/lib/client-config";
import { COLORS, TYPOGRAPHY } from "@/lib/design/design-tokens";
import { clientKeyToInventorySubstrateKey } from "@/lib/agent/tools/intelligence/_shared";
import { getSetupInventorySnapshot } from "@/lib/admin/setup-data-broker";
import type { InventorySegmentRollup } from "@/lib/admin/setup-acts-registry";
import { composeDataTrustBlocks } from "@/lib/admin/data-trust-composer";

export const metadata = { title: "Admin Home | AbarVa" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Locked design system only — cream + near-black ink, hairline borders,
// one restrained accent. No multi-hue stat tiles.
const palette = {
  paper: COLORS.cream,
  card: COLORS.white,
  line: `${COLORS.ink}14`,
  ink: COLORS.ink,
  muted: `${COLORS.ink}99`,
  soft: `${COLORS.ink}b0`,
  amber: COLORS.amberInk,
  amberSoft: COLORS.amberSoft,
  coral: COLORS.coralInk,
  white: COLORS.white,
};

function clientMark(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

// Map a segment's health to a calm, plain-language status word + accent.
function segmentStatus(health: string): { label: string; accent: string } {
  switch (health) {
    case "complete":
      return { label: "Ready", accent: `${COLORS.ink}99` };
    case "not_started":
      return { label: "Not started", accent: COLORS.coralInk };
    case "critical":
    case "sparse":
      return { label: "Needs attention", accent: COLORS.amberInk };
    default:
      return { label: "In progress", accent: COLORS.amberInk };
  }
}

function pct(score: number): string {
  // coverage_score is 0..1 in the rollup; render as a whole percent.
  const n = score <= 1 ? Math.round(score * 100) : Math.round(score);
  return `${Math.max(0, Math.min(100, n))}%`;
}

export default async function AdminOverviewPage() {
  const tenant = await resolveAdminTenant();
  const clientOption = getClientOption(tenant.clientKey);
  const mark = clientMark(tenant.tenantName);

  // ── Real per-tenant substrate (same broker Data Trust uses) ──────────
  // Replaces the previous hardcoded mock numbers that were identical for
  // every tenant. Falls back to a calm empty state if the broker is down
  // or the tenant has no loaded substrate yet — never invented numbers.
  const brokerTenantKey = clientKeyToInventorySubstrateKey(tenant.clientKey);
  const snapshot = brokerTenantKey
    ? await getSetupInventorySnapshot(brokerTenantKey).catch(() => null)
    : null;
  const segments: InventorySegmentRollup[] = snapshot?.segments ?? [];
  const blocks = composeDataTrustBlocks(segments);

  const totalRecords = segments.reduce((n, s) => n + s.recordCount, 0);
  const decisionGrade = blocks.state.decisionGrade;
  const segmentsLoaded = blocks.state.segmentsLoaded;
  const segmentsTotal = segments.length;
  const blocking = blocks.state.emptyBlocking;

  // The dimension table: top segments by record weight, calm + real.
  const dimensionRows = [...segments]
    .sort((a, b) => b.recordCount - a.recordCount)
    .slice(0, 6)
    .map((s) => {
      const status = segmentStatus(String(s.healthState));
      return {
        dimension: s.segmentName,
        status,
        records: s.recordCount,
        coverage: pct(s.coverageScore),
      };
    });

  // Review queue: real gaps surfaced by the composer (read-only — loading
  // controls live in Data Loads, not here).
  const reviewItems = blocks.actionQueue.slice(0, 4);

  const hasSubstrate = segmentsTotal > 0;

  return (
    <AdminCanonShellV2 tenantName={tenant.tenantName}>
      <main
        data-admin-home-native="true"
        style={{
          minHeight: "100%",
          background: palette.paper,
          color: palette.ink,
          padding: "30px 34px 38px",
        }}
      >
        {/* ── Hero: client identity + one read-only orientation + one CTA ── */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 320px",
            gap: 24,
            alignItems: "start",
            marginBottom: 24,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 14,
              }}
            >
              <div
                aria-label={`${tenant.tenantName} client mark`}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 11,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: clientOption.color,
                  color: palette.white,
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 14,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                }}
              >
                {mark}
              </div>
              <div>
                <p
                  style={{
                    ...ADMIN_PAGE_HEADER_STYLES.eyebrow,
                    color: palette.muted,
                  }}
                >
                  {clientOption.vertical} · system review
                </p>
                <h1
                  style={{
                    ...ADMIN_PAGE_HEADER_STYLES.title,
                    fontFamily: TYPOGRAPHY.serif,
                    fontWeight: 400,
                  }}
                >
                  {tenant.tenantName} home
                </h1>
              </div>
            </div>
            <p
              style={{
                ...ADMIN_PAGE_HEADER_STYLES.subtitle,
                color: palette.soft,
                maxWidth: 560,
              }}
            >
              A read-only view of what AbarVa knows for this client today:
              loaded dimensions, evidence quality, and the gaps that change
              readiness. Operators load and process files in Data Loads.
            </p>

            {/* One-line readiness strip — real per-tenant numbers. */}
            <div
              style={{
                marginTop: 20,
                padding: "12px 16px",
                border: `1px solid ${palette.line}`,
                borderRadius: 8,
                background: palette.paper,
                display: "flex",
                flexWrap: "wrap",
                gap: "6px 18px",
                alignItems: "center",
                fontSize: 13,
                color: palette.soft,
              }}
              aria-label="Substrate readiness summary"
            >
              <span>
                <strong style={{ color: palette.ink }}>{segmentsLoaded}</strong>
                /{segmentsTotal} dimensions loaded
              </span>
              <span aria-hidden>·</span>
              <span>
                <strong style={{ color: palette.ink }}>
                  {totalRecords.toLocaleString()}
                </strong>{" "}
                records
              </span>
              <span aria-hidden>·</span>
              <span>
                <strong style={{ color: palette.ink }}>{decisionGrade}</strong>{" "}
                decision-grade
              </span>
              <span aria-hidden>·</span>
              <span
                style={{
                  color: blocking > 0 ? palette.coral : palette.soft,
                  fontWeight: blocking > 0 ? 700 : 400,
                }}
              >
                <strong>{blocking}</strong> blocking
              </span>
            </div>
          </div>

          <aside
            style={{
              border: `1px solid ${palette.amber}2a`,
              borderRadius: 8,
              background: palette.amberSoft,
              padding: 18,
              display: "grid",
              gap: 10,
              alignContent: "start",
            }}
          >
            <p
              style={{
                margin: 0,
                color: palette.amber,
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Next decision
            </p>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                lineHeight: 1.25,
                fontWeight: 600,
              }}
            >
              {hasSubstrate
                ? "Review the loaded dimensions before expanding production scope."
                : `Begin the first governed load for ${tenant.tenantName}.`}
            </h2>
            <p
              style={{
                margin: 0,
                color: palette.amber,
                fontSize: 13,
                lineHeight: 1.45,
              }}
            >
              Home reviews what is in the system. Data Loads is the governed
              upload, validation, approval, and commit workflow.
            </p>
            <a
              href="/admin/setup"
              style={{
                width: "fit-content",
                marginTop: 2,
                color: palette.white,
                background: palette.ink,
                borderRadius: 6,
                padding: "9px 14px",
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Open Data Loads
            </a>
          </aside>
        </section>

        {/* ── Loaded data by dimension + review queue ── */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.4fr) minmax(320px, 0.6fr)",
            gap: 20,
          }}
        >
          <div
            style={{
              border: `1px solid ${palette.line}`,
              borderRadius: 8,
              background: palette.card,
            }}
          >
            <div
              style={{
                padding: "16px 18px",
                borderBottom: `1px solid ${palette.line}`,
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "baseline",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontFamily: TYPOGRAPHY.serif,
                  fontWeight: 400,
                }}
              >
                Loaded data by dimension
              </h2>
              <a
                href="/admin/data-trust"
                style={{
                  color: palette.ink,
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                }}
              >
                View data trust
              </a>
            </div>

            {hasSubstrate ? (
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13.5,
                }}
              >
                <thead>
                  <tr style={{ textAlign: "left" }}>
                    {["Dimension", "Status", "Records", "Coverage"].map(
                      (head) => (
                        <th
                          key={head}
                          style={{
                            padding: "11px 16px",
                            color: palette.muted,
                            fontFamily: TYPOGRAPHY.mono,
                            fontSize: 10,
                            fontWeight: 800,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            borderBottom: `1px solid ${palette.line}`,
                          }}
                        >
                          {head}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {dimensionRows.map((row) => (
                    <tr
                      key={row.dimension}
                      style={{ borderTop: `1px solid ${palette.line}` }}
                    >
                      <td style={{ padding: "12px 16px", fontWeight: 600 }}>
                        {row.dimension}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            borderRadius: 999,
                            padding: "3px 9px",
                            border: `1px solid ${row.status.accent}44`,
                            color: row.status.accent,
                            fontSize: 11,
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {row.status.label}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: palette.soft,
                          fontWeight: 600,
                        }}
                      >
                        {row.records.toLocaleString()}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 700 }}>
                        {row.coverage}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div
                style={{
                  padding: 28,
                  display: "grid",
                  gap: 8,
                  textAlign: "center",
                }}
              >
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                  No dimensions loaded yet
                </h3>
                <p
                  style={{
                    margin: "0 auto",
                    maxWidth: 380,
                    color: palette.soft,
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  Open Data Loads to begin the first governed load for{" "}
                  {tenant.tenantName}. Numbers here reflect real committed
                  substrate only — never placeholder values.
                </p>
              </div>
            )}
          </div>

          <div
            style={{
              border: `1px solid ${palette.line}`,
              borderRadius: 8,
              background: palette.card,
            }}
          >
            <div
              style={{
                padding: "16px 18px",
                borderBottom: `1px solid ${palette.line}`,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontFamily: TYPOGRAPHY.serif,
                  fontWeight: 400,
                }}
              >
                Review queue
              </h2>
              <p style={{ margin: "5px 0 0", color: palette.muted, fontSize: 13 }}>
                Read-only gaps that change client readiness. Loading controls
                stay in Data Loads.
              </p>
            </div>
            <div style={{ display: "grid" }}>
              {reviewItems.length > 0 ? (
                reviewItems.map((item, index) => (
                  <div
                    key={item.id}
                    style={{
                      padding: "14px 18px",
                      borderTop:
                        index === 0 ? "none" : `1px solid ${palette.line}`,
                      display: "grid",
                      gap: 5,
                    }}
                  >
                    <strong style={{ fontSize: 14, fontWeight: 600 }}>
                      {item.segmentName}
                    </strong>
                    <p
                      style={{
                        margin: 0,
                        color: palette.soft,
                        fontSize: 13,
                        lineHeight: 1.4,
                      }}
                    >
                      {item.consequence}
                    </p>
                  </div>
                ))
              ) : (
                <div style={{ padding: "18px", color: palette.soft, fontSize: 13 }}>
                  Nothing needs review — every loaded dimension is current.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </AdminCanonShellV2>
  );
}
