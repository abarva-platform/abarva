import Link from "next/link";
import type { CSSProperties } from "react";

import { AppShell } from "@/components/shell/AppShell";
import { getActiveClientKey, getActiveClientRow, hasLockedTenantSession } from "@/lib/active-client";
import { getAiControlTowerReadModel } from "@/lib/ai-control-tower/read-model";
import { canonicalClientDisplayName } from "@/lib/client-config";
import { getEnterpriseContextOverviewForTenant } from "@/lib/enterprise-context/intelligence-read-model";

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

function enterpriseContextTenantKey(value: string | null | undefined): string | null {
  const key = value?.trim().toLowerCase();
  if (!key) return null;
  if (key === "arcturus" || key === "firstcapital") return "first-capital";
  if (key === "meridian") return "meridian-health";
  if (key === "apexretail") return "apex-retail";
  return key;
}

function money(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "$0";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  return `$${(value / 1_000_000).toFixed(1)}M`;
}

function pct(value: number | null) {
  return value === null ? "n/a" : `${Math.round(value)}%`;
}

function toneColor(tone: string) {
  if (["critical", "high", "red"].includes(tone.toLowerCase())) return "#9e332e";
  if (["medium", "amber", "watch"].includes(tone.toLowerCase())) return "#a66a1f";
  if (["low", "green", "ready"].includes(tone.toLowerCase())) return "#31765b";
  return "#244c90";
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const rawRequestedClient = firstSearchValue((await searchParams)?.client);
  const requestedClient = (await hasLockedTenantSession()) ? rawRequestedClient : null;
  const client = await getActiveClientRow(requestedClient).catch(() => null);
  const resolvedClientKey =
    client?.key ?? (await getActiveClientKey(requestedClient).catch(() => requestedClient));
  const contextTenantKey = enterpriseContextTenantKey(resolvedClientKey);
  const tenantName =
    canonicalClientDisplayName({ key: resolvedClientKey, name: client?.name }) ??
    client?.name ??
    "AbarVa Client";

  const [towerModel, overview] = await Promise.all([
    getAiControlTowerReadModel({
      clientId: client?.id ?? null,
      clientKey: resolvedClientKey,
      tenantName,
    }),
    contextTenantKey
      ? getEnterpriseContextOverviewForTenant(contextTenantKey, tenantName).catch(() => null)
      : Promise.resolve(null),
  ]);

  const realizedValue = towerModel.initiatives.reduce((sum, row) => sum + row.realizedUsd, 0);
  const promisedValue = towerModel.initiatives.reduce((sum, row) => sum + row.promisedUsd, 0);
  const aiSpendExposure = towerModel.spend.reduce((sum, row) => sum + row.annualizedSpendUsd, 0);
  const highRisks = towerModel.risks
    .filter((risk) => ["critical", "high", "red"].includes(risk.severity.toLowerCase()) || risk.gate === "fail")
    .slice(0, 4);
  const topInsights = (overview?.contextInsights ?? []).slice(0, 4);
  const weakAdoption = towerModel.functions
    .filter((row) => row.adoptionPct !== null)
    .sort((a, b) => (a.adoptionPct ?? 100) - (b.adoptionPct ?? 100))[0];
  const provenInitiative = [...towerModel.initiatives].sort((a, b) => b.realizedUsd - a.realizedUsd)[0];
  const valueProgress = promisedValue > 0 ? Math.round((realizedValue / promisedValue) * 100) : 0;
  const firstCapitalProfile = {
    revenue: "$5.4B",
    assets: "$148B",
    itBudget: "$498M",
    aiSpend: "$61M",
    employees: "14,200",
  };

  const foundationCards = [
    {
      title: "Business and financial posture",
      body: "Regional commercial bank context is loaded with revenue, asset scale, operating model, branches, regulators, and KPI pressure.",
      signal: `${firstCapitalProfile.revenue} revenue, ${firstCapitalProfile.assets} assets`,
    },
    {
      title: "Technology and cost estate",
      body: "Core banking, payments, cloud, risk, data, ERP, cyber, and vendor spend are connected to owners and business functions.",
      signal: `${firstCapitalProfile.itBudget} IT budget baseline`,
    },
    {
      title: "AI value and control posture",
      body: "AI initiatives are tied to adoption, spend, model risk, evidence gates, and benefit realization instead of isolated status reports.",
      signal: `${money(aiSpendExposure)} spend to prove`,
    },
    {
      title: "Industry corpus",
      body: "Banking patterns now help the system interpret SR 11-7, FINRA supervision, AML, digital onboarding, FedNow, payments, and efficiency ratio questions.",
      signal: "Financial-services reasoning layer",
    },
  ];

  const moduleStory = [
    ["Intelligence", "Derives the cross-context reads: what the loaded context implies, what is blocked, and what should be challenged.", "/intelligence"],
    ["Tower", "Turns AI initiatives into an executive control view across value, productivity, agents, spend, risk, evidence, and actions.", "/tower"],
    ["Moves", "Converts a derived insight into a governed change path with owners, gates, evidence, and execution rhythm.", "/strategic-moves"],
    ["Source", "Shows where claims came from: systems, documents, events, approvals, and evidence trails.", "/source"],
  ] as const;

  const questions = [
    "Is AI spend turning into measurable productivity and value?",
    "Which initiatives should scale, hold, restructure, or stop?",
    "Where do regulatory controls block AI ambition?",
    "Which vendor and system dependencies create execution drag?",
    "What evidence would a CIO, CFO, CRO, or auditor ask for next?",
    "Which move should be shaped from this insight right now?",
  ];

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
      <main style={styles.page}>
        <section style={styles.hero}>
          <div>
            <p style={styles.kicker}>Executive home · {tenantName}</p>
            <h1 style={styles.h1}>The enterprise foundation is loaded. Now every module can reason from it.</h1>
            <p style={styles.lede}>
              First Capital is no longer a blank demo. AbarVa can read the company context, banking corpus,
              technology estate, AI investments, risks, and evidence together, then route the work into
              Intelligence, Tower, Moves, and Source.
            </p>
            <div style={styles.ctaRow}>
              <Link href="/intelligence" style={styles.primaryCta}>Open Intelligence</Link>
              <Link href="/tower" style={styles.secondaryCta}>Open AI Control Tower</Link>
            </div>
          </div>
          <aside style={styles.profileCard}>
            <p style={styles.smallKicker}>First Capital snapshot</p>
            <strong>Regional commercial bank</strong>
            <span>OCC, Federal Reserve, FDIC, CFPB, FinCEN oversight</span>
            <span>Refreshed Jun 17, 2026</span>
          </aside>
        </section>

        <section style={styles.kpiGrid} aria-label="First Capital executive KPIs">
          <Metric label="Revenue" value={firstCapitalProfile.revenue} note="FY25 operating context" tone="ready" />
          <Metric label="Total assets" value={firstCapitalProfile.assets} note="Scale of banking franchise" tone="ready" />
          <Metric label="IT budget" value={firstCapitalProfile.itBudget} note="Run, change, cloud, cyber, data, AI" tone="watch" />
          <Metric label="AI spend" value={firstCapitalProfile.aiSpend} note="Program spend requiring value proof" tone="watch" />
          <Metric label="Value proven" value={money(realizedValue)} note={`${valueProgress}% of promised value`} tone={valueProgress >= 50 ? "ready" : "watch"} />
        </section>

        <section style={styles.twoColumn}>
          <article style={styles.panel}>
            <p style={styles.smallKicker}>What the loaded foundation is telling us</p>
            <h2 style={styles.h2}>The executive read starts here.</h2>
            <div style={styles.signalList}>
              {(topInsights.length ? topInsights : highRisks).slice(0, 4).map((item) => {
                const title = "headline" in item ? item.headline : item.name;
                const body = "so_what" in item ? item.so_what : item.description;
                const tone = "materiality" in item ? item.materiality : item.severity;
                return (
                  <div key={item.id} style={{ ...styles.signalRow, borderLeftColor: toneColor(tone) }}>
                    <strong>{title}</strong>
                    <span>{body}</span>
                  </div>
                );
              })}
            </div>
          </article>

          <article style={styles.panel}>
            <p style={styles.smallKicker}>Watch first</p>
            <h2 style={styles.h2}>The first conversation is value under control.</h2>
            <div style={styles.watchGrid}>
              <MiniRead label="Spend to prove" value={money(aiSpendExposure)} note="AI dollars need value, adoption, and evidence before renewal or expansion." tone="watch" />
              <MiniRead label="Risk blockers" value={`${highRisks.length} areas`} note="Governance pressure must be resolved before scale claims are credible." tone={highRisks.length ? "high" : "ready"} />
              <MiniRead label="Weak adoption" value={weakAdoption?.name ?? "Not surfaced"} note={weakAdoption ? `${pct(weakAdoption.adoptionPct)} adoption; ${weakAdoption.blocker}` : "No low-adoption function surfaced."} tone={(weakAdoption?.adoptionPct ?? 100) < 50 ? "high" : "watch"} />
              <MiniRead label="Proof point" value={provenInitiative?.title ?? "No proof point surfaced"} note={provenInitiative ? `${money(provenInitiative.realizedUsd)} realized value; ${provenInitiative.confidence} confidence.` : "Load benefit realization to show proof."} tone="ready" />
            </div>
          </article>
        </section>

        <section style={styles.foundation}>
          <div>
            <p style={styles.kicker}>The foundation layer</p>
            <h2 style={styles.h2}>Why context and corpus make the product different.</h2>
            <p style={styles.bodyText}>
              The value is not that files were uploaded. The value is that AbarVa can connect company strategy,
              financials, systems, owners, vendors, risk controls, AI spend, adoption, and industry patterns into
              decisions a CIO can defend.
            </p>
          </div>
          <div style={styles.foundationGrid}>
            {foundationCards.map((card) => (
              <article key={card.title} style={styles.foundationCard}>
                <span>{card.signal}</span>
                <strong>{card.title}</strong>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={styles.moduleBand}>
          <p style={styles.kicker}>How the modules shine</p>
          <h2 style={styles.h2}>One foundation, four executive paths.</h2>
          <div style={styles.moduleGrid}>
            {moduleStory.map(([title, body, href]) => (
              <Link key={title} href={href} style={styles.moduleCard}>
                <strong>{title}</strong>
                <span>{body}</span>
              </Link>
            ))}
          </div>
        </section>

        <section style={styles.questionBand}>
          <div>
            <p style={styles.kicker}>Questions now answerable</p>
            <h2 style={styles.h2}>This is what the CIO can ask tomorrow.</h2>
          </div>
          <div style={styles.questionGrid}>
            {questions.map((question) => <span key={question}>{question}</span>)}
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function Metric({ label, value, note, tone }: { label: string; value: string; note: string; tone: string }) {
  return (
    <article style={{ ...styles.metric, borderTopColor: toneColor(tone) }}>
      <p style={styles.smallKicker}>{label}</p>
      <strong>{value}</strong>
      <span>{note}</span>
    </article>
  );
}

function MiniRead({ label, value, note, tone }: { label: string; value: string; note: string; tone: string }) {
  return (
    <article style={{ ...styles.miniRead, borderColor: `${toneColor(tone)}55` }}>
      <p style={styles.smallKicker}>{label}</p>
      <strong>{value}</strong>
      <span>{note}</span>
    </article>
  );
}

const styles = {
  page: {
    minHeight: 0,
    overflow: "auto",
    background: "#f8f7f2",
    color: "#101827",
    padding: "30px clamp(22px, 4vw, 56px) 56px",
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 270px",
    gap: 32,
    alignItems: "start",
    maxWidth: 1280,
  },
  kicker: {
    margin: 0,
    color: "#667085",
    fontFamily: "var(--font-geist-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
    fontSize: 11,
    fontWeight: 850,
    letterSpacing: 2.4,
    textTransform: "uppercase" as const,
  },
  smallKicker: {
    margin: 0,
    color: "#667085",
    fontFamily: "var(--font-geist-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
    fontSize: 10,
    fontWeight: 850,
    letterSpacing: 1.8,
    textTransform: "uppercase" as const,
  },
  h1: {
    margin: "10px 0 0",
    maxWidth: 980,
    fontFamily: "var(--font-serif, Georgia, serif)",
    fontSize: "clamp(42px, 5vw, 72px)",
    lineHeight: 0.98,
    letterSpacing: 0,
  },
  h2: {
    margin: "8px 0 0",
    fontFamily: "var(--font-serif, Georgia, serif)",
    fontSize: 34,
    lineHeight: 1.08,
    letterSpacing: 0,
  },
  lede: {
    margin: "16px 0 0",
    maxWidth: 920,
    fontSize: 18,
    lineHeight: 1.5,
    color: "#475467",
  },
  bodyText: {
    margin: "12px 0 0",
    maxWidth: 760,
    color: "#475467",
    fontSize: 16,
    lineHeight: 1.55,
  },
  ctaRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 10,
    marginTop: 22,
  },
  primaryCta: {
    borderRadius: 8,
    background: "#102456",
    color: "white",
    padding: "12px 16px",
    fontSize: 13,
    fontWeight: 850,
    textDecoration: "none",
  },
  secondaryCta: {
    border: "1px solid #d9d6cc",
    borderRadius: 8,
    background: "#fffdfa",
    color: "#102456",
    padding: "12px 16px",
    fontSize: 13,
    fontWeight: 850,
    textDecoration: "none",
  },
  profileCard: {
    display: "grid",
    gap: 10,
    border: "1px solid #d9d6cc",
    borderRadius: 8,
    background: "#fffdfa",
    padding: 16,
    color: "#475467",
    fontSize: 13,
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(150px, 1fr))",
    gap: 10,
    maxWidth: 1280,
    marginTop: 28,
  },
  metric: {
    display: "grid",
    gap: 6,
    border: "1px solid #d9d6cc",
    borderTop: "3px solid #244c90",
    borderRadius: 8,
    background: "#fffdfa",
    padding: 16,
  },
  twoColumn: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.05fr) minmax(360px, 0.95fr)",
    gap: 14,
    maxWidth: 1280,
    marginTop: 14,
  },
  panel: {
    border: "1px solid #d9d6cc",
    borderRadius: 8,
    background: "#fffdfa",
    padding: 18,
  },
  signalList: {
    display: "grid",
    gap: 10,
    marginTop: 16,
  },
  signalRow: {
    display: "grid",
    gap: 6,
    border: "1px solid #ece8df",
    borderLeft: "4px solid #244c90",
    borderRadius: 8,
    background: "#fbfaf7",
    padding: 12,
  },
  watchGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
    marginTop: 16,
  },
  miniRead: {
    display: "grid",
    gap: 6,
    border: "1px solid #d9d6cc",
    borderRadius: 8,
    background: "#fbfaf7",
    padding: 12,
  },
  foundation: {
    display: "grid",
    gridTemplateColumns: "0.8fr 1.2fr",
    gap: 20,
    maxWidth: 1280,
    marginTop: 28,
    paddingTop: 28,
    borderTop: "1px solid #d9d6cc",
  },
  foundationGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
  },
  foundationCard: {
    display: "grid",
    gap: 8,
    border: "1px solid #d9d6cc",
    borderRadius: 8,
    background: "#fffdfa",
    padding: 16,
  },
  moduleBand: {
    maxWidth: 1280,
    marginTop: 28,
    paddingTop: 28,
    borderTop: "1px solid #d9d6cc",
  },
  moduleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 10,
    marginTop: 16,
  },
  moduleCard: {
    display: "grid",
    gap: 10,
    minHeight: 150,
    border: "1px solid #d9d6cc",
    borderRadius: 8,
    background: "#fffdfa",
    color: "#101827",
    padding: 16,
    textDecoration: "none",
  },
  questionBand: {
    display: "grid",
    gridTemplateColumns: "0.8fr 1.2fr",
    gap: 18,
    maxWidth: 1280,
    marginTop: 28,
    paddingTop: 28,
    borderTop: "1px solid #d9d6cc",
  },
  questionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
  },
} satisfies Record<string, CSSProperties>;
