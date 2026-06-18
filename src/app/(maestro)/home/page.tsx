import Link from "next/link";

import { AppShell } from "@/components/shell/AppShell";
import { getActiveClientKey, getActiveClientRow, hasLockedTenantSession } from "@/lib/active-client";
import { getAiControlTowerReadModel } from "@/lib/ai-control-tower/read-model";
import { canonicalClientDisplayName } from "@/lib/client-config";

export const metadata = { title: "Home · AbarVa" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface HomePageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

function firstSearchValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function pickKpi(
  model: Awaited<ReturnType<typeof getAiControlTowerReadModel>>,
  label: string,
  fallback: string,
) {
  const normalized = label.toLowerCase();
  return (
    model.kpis.find((kpi) => kpi.label.toLowerCase().includes(normalized)) ?? {
      label,
      value: fallback,
      note: "Awaiting committed substrate",
      tone: "neutral" as const,
    }
  );
}

function money(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "$0";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  return `$${(value / 1_000_000).toFixed(1)}M`;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const rawRequestedClient = firstSearchValue((await searchParams)?.client);
  const requestedClient = (await hasLockedTenantSession()) ? rawRequestedClient : null;
  const client = await getActiveClientRow(requestedClient).catch(() => null);
  const resolvedClientKey =
    client?.key ?? (await getActiveClientKey(requestedClient).catch(() => requestedClient));
  const tenantName =
    canonicalClientDisplayName({ key: resolvedClientKey, name: client?.name }) ??
    client?.name ??
    "AbarVa Client";

  const towerModel = await getAiControlTowerReadModel({
    clientId: client?.id ?? null,
    clientKey: resolvedClientKey,
    tenantName,
  });

  const observed = pickKpi(towerModel, "Observed", `${towerModel.initiatives.length}`);
  const value = pickKpi(towerModel, "Measured", money(towerModel.initiatives.reduce((sum, row) => sum + row.realizedUsd, 0)));
  const spend = pickKpi(towerModel, "Spend", money(towerModel.spend.reduce((sum, row) => sum + row.annualizedSpendUsd, 0)));
  const evidence = pickKpi(towerModel, "Evidence", `${towerModel.evidence.length}`);
  const priorityRisks = towerModel.risks
    .filter((risk) => ["high", "critical", "red"].includes(risk.severity.toLowerCase()) || risk.status.toLowerCase().includes("open"))
    .slice(0, 3);

  return (
    <AppShell
      surface="home"
      topBarProps={{
        tenantName,
        showLocked: Boolean(resolvedClientKey),
        context: "Home",
      }}
      hasTenantKey={Boolean(resolvedClientKey)}
    >
      <main
        style={{
          minHeight: 0,
          overflow: "auto",
          background: "#f8f7f4",
          color: "#101827",
          padding: "28px clamp(24px, 4vw, 54px) 40px",
        }}
      >
        <section style={{ maxWidth: 1240 }}>
          <p
            style={{
              margin: "0 0 10px",
              color: "#667085",
              fontFamily: "var(--font-geist-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 2.4,
              textTransform: "uppercase",
            }}
          >
            Executive home · {tenantName}
          </p>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 24, alignItems: "flex-start" }}>
            <div>
              <h1
                style={{
                  margin: 0,
                  maxWidth: 820,
                  fontFamily: "var(--font-serif, Georgia, serif)",
                  fontSize: "clamp(36px, 5vw, 58px)",
                  lineHeight: 1.02,
                  letterSpacing: 0,
                }}
              >
                Start with what is loaded, then go where the decision is.
              </h1>
              <p style={{ margin: "14px 0 0", maxWidth: 780, fontSize: 17, lineHeight: 1.55, color: "#475467" }}>
                This hub keeps the demo out of setup mode and routes the executive flow through Intelligence, Tower, Moves, and Source.
              </p>
            </div>
            <Link
              href="/intelligence"
              style={{
                flexShrink: 0,
                borderRadius: 8,
                background: "#102456",
                color: "white",
                padding: "12px 16px",
                fontSize: 13,
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              Open Intelligence
            </Link>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(180px, 1fr))",
            gap: 10,
            maxWidth: 1240,
            marginTop: 24,
          }}
        >
          {[observed, value, spend, evidence].map((kpi) => (
            <article key={kpi.label} style={{ border: "1px solid #d9d6cc", borderRadius: 8, background: "#fffdfa", padding: 16 }}>
              <div
                style={{
                  color: "#667085",
                  fontFamily: "var(--font-geist-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                {kpi.label}
              </div>
              <div style={{ marginTop: 8, fontFamily: "var(--font-serif, Georgia, serif)", fontSize: 32, lineHeight: 1, fontWeight: 800 }}>
                {kpi.value}
              </div>
              <p style={{ margin: "8px 0 0", color: "#4b5563", fontSize: 13 }}>{kpi.note}</p>
            </article>
          ))}
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.1fr) minmax(320px, 0.9fr)",
            gap: 14,
            maxWidth: 1240,
            marginTop: 14,
          }}
        >
          <article style={{ border: "1px solid #d9d6cc", borderRadius: 8, background: "#fffdfa", padding: 18 }}>
            <div
              style={{
                color: "#667085",
                fontFamily: "var(--font-geist-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Recommended path
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(140px, 1fr))", gap: 10, marginTop: 14 }}>
              {[
                ["Intelligence", "What context is loaded and what does it imply?", "/intelligence"],
                ["Tower", "How are AI initiatives performing by value, spend, risk, and evidence?", "/tower"],
                ["Moves", "Turn a decision into a governed execution path.", "/strategic-moves"],
                ["Source", "Trace source events, documents, and system evidence.", "/source"],
              ].map(([title, body, href]) => (
                <Link
                  key={title}
                  href={href}
                  style={{
                    display: "block",
                    minHeight: 116,
                    border: "1px solid #dedbd2",
                    borderRadius: 8,
                    padding: 14,
                    color: "#111827",
                    textDecoration: "none",
                    background: "#fbfaf7",
                  }}
                >
                  <strong style={{ display: "block", fontSize: 16 }}>{title}</strong>
                  <span style={{ display: "block", marginTop: 8, color: "#586174", fontSize: 13, lineHeight: 1.45 }}>{body}</span>
                </Link>
              ))}
            </div>
          </article>

          <article style={{ border: "1px solid #d9d6cc", borderRadius: 8, background: "#fffdfa", padding: 18 }}>
            <div
              style={{
                color: "#667085",
                fontFamily: "var(--font-geist-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Watch first
            </div>
            <h2 style={{ margin: "10px 0 12px", fontFamily: "var(--font-serif, Georgia, serif)", fontSize: 28, lineHeight: 1.08 }}>
              {priorityRisks.length ? "Open risk pressure" : "No high-risk rows in the current read model"}
            </h2>
            <div style={{ display: "grid", gap: 10 }}>
              {(priorityRisks.length ? priorityRisks : towerModel.initiatives.slice(0, 3)).map((item) => (
                <div key={item.id} style={{ borderTop: "1px solid #ece8df", paddingTop: 10 }}>
                  <strong style={{ display: "block", fontSize: 14 }}>
                    {"title" in item ? item.title : item.name}
                  </strong>
                  <span style={{ color: "#667085", fontSize: 13 }}>
                    {"owner" in item ? item.owner : ""} · {"functionName" in item ? item.functionName : ""}
                  </span>
                </div>
              ))}
            </div>
          </article>
        </section>
      </main>
    </AppShell>
  );
}
