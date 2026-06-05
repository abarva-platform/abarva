import Link from "next/link";
import { AdminCanonShellV2 } from "@/components/admin/AdminCanonShellV2";
import { resolveAdminTenant } from "@/lib/admin/admin-tenant";
import { CXO_INTEL_BUNDLES } from "@/lib/cxo-intel/schemas";
import { COLORS, RADIUS, TYPOGRAPHY } from "@/lib/design/design-tokens";

export const metadata = { title: "CXO Intel Loader | AbarVa Admin" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

function labelStyle(color = `${COLORS.ink}99`) {
  return {
    color,
    fontFamily: TYPOGRAPHY.mono,
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  } as const;
}

export default async function CxoIntelIndexPage() {
  const tenant = await resolveAdminTenant();

  return (
    <AdminCanonShellV2 tenantName={tenant.tenantName}>
      <main style={{ padding: "32px 36px 48px", background: COLORS.cream, flex: 1 }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div style={labelStyle()}>Setup · federated data spine</div>
          <h1
            style={{
              margin: "8px 0 8px",
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 42,
              fontWeight: 400,
              letterSpacing: 0,
            }}
          >
            CXO Intel Loader
          </h1>
          <p style={{ margin: 0, maxWidth: 760, color: `${COLORS.ink}99`, fontSize: 14 }}>
            Convert each HoldCo CXO bundle into validated, tenant-scoped substrate before Tower,
            Moves, or Source uses the claims. CIO and CFO are active for Wave 1; COO, CHRO,
            and GC are visible as locked future bundles.
          </p>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
              marginTop: 26,
            }}
          >
            {CXO_INTEL_BUNDLES.map((bundle) => {
              const active = bundle.waveState === "active";
              return (
                <article
                  key={bundle.key}
                  style={{
                    border: `1px solid ${COLORS.ink}14`,
                    borderRadius: RADIUS.md,
                    background: COLORS.white,
                    padding: 18,
                    minHeight: 220,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div style={labelStyle(active ? COLORS.mintInk : `${COLORS.ink}66`)}>
                    {active ? "Wave 1 active" : "Wave 2 locked"}
                  </div>
                  <h2 style={{ margin: 0, fontSize: 19, fontFamily: TYPOGRAPHY.serif, fontWeight: 400 }}>
                    {bundle.title}
                  </h2>
                  <p style={{ margin: 0, color: `${COLORS.ink}99`, fontSize: 12.5, lineHeight: 1.5 }}>
                    {bundle.headline}
                  </p>
                  <div style={{ marginTop: "auto", color: `${COLORS.ink}88`, fontSize: 12 }}>
                    <strong style={{ color: COLORS.ink }}>{bundle.files.length || "Future"} files</strong>
                    <br />
                    Owner: {bundle.ownerRole}
                  </div>
                  {active ? (
                    <Link
                      href={`/admin/setup/cxo-intel/${bundle.key}`}
                      style={{
                        width: "fit-content",
                        borderRadius: RADIUS.sm,
                        padding: "9px 13px",
                        background: COLORS.ink,
                        color: COLORS.white,
                        textDecoration: "none",
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      Open bundle
                    </Link>
                  ) : (
                    <span style={{ ...labelStyle(), color: `${COLORS.ink}66` }}>Schema pending</span>
                  )}
                </article>
              );
            })}
          </section>

          <section
            style={{
              marginTop: 20,
              border: `1px solid ${COLORS.ink}14`,
              borderRadius: RADIUS.md,
              background: COLORS.white,
              padding: 18,
            }}
          >
            <div style={labelStyle()}>Current tenant</div>
            <p style={{ margin: "8px 0 0", color: `${COLORS.ink}99`, fontSize: 13 }}>
              {tenant.tenantName} · rows validated here must land against client{" "}
              <code>{tenant.clientId}</code>. L0 Lakeshore may see aggregate status; sibling
              HoldCo transaction-grain remains governed by explicit access.
            </p>
          </section>
        </div>
      </main>
    </AdminCanonShellV2>
  );
}
